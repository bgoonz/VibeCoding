"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { KanbanBoard } from "./KanbanBoard";
import { ChatSidebar, type Message } from "./ChatSidebar";
import type { BoardData } from "@/lib/kanban";

type Snapshot = { board: BoardData; revision: number };
type Phase = "loading" | "signin" | "board" | "error";

class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function api<T>(route: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api/${route}`, {
    method,
    cache: "no-store",
    ...(body === undefined ? {} : {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, typeof result.detail === "string" ? result.detail : "Request failed.");
  }
  return result;
}

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Request failed. Try again.";

export function Workspace() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [pendingBoard, setPendingBoard] = useState<BoardData>();
  const [busy, setBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [errorInChat, setErrorInChat] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const locked = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function restore() {
      try {
        const session = await api<{ signedIn: boolean }>("session");
        const board = session.signedIn ? await api<Snapshot>("board") : undefined;
        if (mounted) {
          setSnapshot(board);
          setPhase(board ? "board" : "signin");
        }
      } catch (error) {
        if (mounted) {
          setError(errorText(error));
          setPhase(error instanceof ApiError && error.status === 401 ? "signin" : "error");
        }
      }
    }
    void restore();
    return () => { mounted = false; };
  }, []);

  function reset() {
    setSnapshot(undefined);
    setMessages([]);
    setPhase("signin");
  }

  async function run(action: () => Promise<void>, isChat = false) {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setChatBusy(isChat);
    setErrorInChat(isChat);
    setError("");
    try {
      await action();
      return true;
    } catch (error) {
      setError(errorText(error));
      if (error instanceof ApiError && error.status === 409) {
        try {
          setSnapshot(await api<Snapshot>("board"));
        } catch (reloadError) {
          setError(errorText(reloadError));
          if (reloadError instanceof ApiError && reloadError.status === 401) reset();
          else setPhase("error");
        }
      } else if (phase === "board" && error instanceof ApiError && error.status === 401) {
        reset();
      }
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
      setChatBusy(false);
    }
  }

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(async () => {
      await api("login", "POST", { username: form.get("username"), password: form.get("password") });
      setSnapshot(await api<Snapshot>("board"));
      setPhase("board");
    });
  }

  function send(message: string) {
    return run(async () => {
      const result = await api<{ reply: string; snapshot: Snapshot | null }>(
        "chat", "POST", { message, history: messages },
      );
      setMessages([...messages, { role: "user", content: message }, { role: "assistant", content: result.reply }]);
      if (result.snapshot) setSnapshot(result.snapshot);
    }, true);
  }

  if (phase === "board" && snapshot) {
    return (
      <KanbanBoard
        data={pendingBoard ?? snapshot.board}
        disabled={busy}
        onUpdate={async (update, options) => {
          if (locked.current) return false;
          const board = update(snapshot.board);
          if (options?.optimistic) setPendingBoard(board);
          try {
            return await run(async () => {
              setSnapshot(await api<Snapshot>("board", "PUT", {
                board, revision: snapshot.revision,
              }));
            });
          } finally {
            if (options?.optimistic) setPendingBoard(undefined);
          }
        }}
        controls={
          <>
            <button className="workspace-secondary" disabled={busy} onClick={() => {
              void run(async () => { await api("logout", "POST"); reset(); });
            }}>Sign out</button>
            {busy && <p role="status" className="mt-2 text-sm">{chatBusy ? "Assistant is working…" : "Saving…"}</p>}
            {error && !errorInChat && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
          </>
        }
        sidebar={
          <ChatSidebar
            messages={messages}
            busy={busy}
            pending={chatBusy}
            error={errorInChat ? error : ""}
            onSend={send}
          />
        }
      />
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-lg content-center px-6">
      <div className="rounded-[32px] border border-[var(--stroke)] bg-white p-8 shadow-[var(--shadow)]">
        <h1 className="font-display text-4xl font-semibold">Kanban Studio</h1>
        {phase === "loading" && <p role="status" className="mt-3">Loading workspace…</p>}
        {phase === "error" && <button className="workspace-secondary mt-4" onClick={() => window.location.reload()}>Reload workspace</button>}
        {phase === "signin" && (
          <form onSubmit={signIn} className="mt-6 grid gap-4">
            <label>Username<input className="workspace-input mt-1" name="username" autoComplete="username" required /></label>
            <label>Password<input className="workspace-input mt-1" name="password" type="password" autoComplete="current-password" required /></label>
            <button className="workspace-primary" disabled={busy}>Sign in</button>
          </form>
        )}
        {error && <p role="alert" className="mt-4 text-red-800">{error}</p>}
      </div>
    </main>
  );
}
