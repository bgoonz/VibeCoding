"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

// Set at build time. The localhost fallback is only used by `next dev`;
// the deploy workflow fails the build if NEXT_PUBLIC_CHAT_URL is missing.
const CHAT_URL =
  process.env.NEXT_PUBLIC_CHAT_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8787" : "");

type ChatMessage = { role: "user" | "assistant"; content: string };

const GREETING = "Hi, I'm Bryan. Ask me anything about my work, skills, or background.";
const PANEL_ID = "chat-panel";

async function readError(res: Response): Promise<string> {
  if (res.headers.get("content-type")?.includes("application/json")) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (data?.error) return data.error;
  }
  return "The chat is unavailable right now. Please try again later.";
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  // Only real conversation turns live here; they are what gets sent to the model.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Errors are shown in the UI but never sent back to the model as history.
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    log.scrollTo({ top: log.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, loading, error]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      if (!CHAT_URL) throw new Error("Chat URL is not configured.");
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      const data = (await res.json()) as { reply?: string };
      setMessages([...next, { role: "assistant", content: data.reply ?? "" }]);
    } catch {
      setError("I couldn't connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open ? (
        <section id={PANEL_ID} className="chat-panel" aria-label="Chat with Bryan">
          <header className="chat-head">
            <span>Chat with Bryan</span>
            <button type="button" onClick={close} aria-label="Close chat">
              ×
            </button>
          </header>
          <div className="chat-log" ref={logRef} aria-live="polite">
            <p className="chat-msg assistant">{GREETING}</p>
            {messages.map((m, i) => (
              <p key={i} className={`chat-msg ${m.role}`}>
                {m.content}
              </p>
            ))}
            {loading ? <p className="chat-msg assistant typing">Typing…</p> : null}
            {error ? (
              <p className="chat-msg error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <form className="chat-form" onSubmit={send}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about my experience…"
              aria-label="Your message"
              maxLength={2000}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </section>
      ) : null}
      <button
        ref={toggleRef}
        type="button"
        className="chat-toggle"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={PANEL_ID}
      >
        {open ? "Close" : "Chat with me"}
      </button>
    </>
  );
}
