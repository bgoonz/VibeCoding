import { useEffect, useRef, useState, type FormEvent } from "react";

export type Message = { role: "user" | "assistant"; content: string };

type Props = {
  messages: Message[];
  busy: boolean;
  pending: boolean;
  error: string;
  onSend: (message: string) => Promise<boolean>;
};

export function ChatSidebar({ messages, busy, pending, error, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const transcript = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = transcript.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, pending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (message && await onSend(message)) setDraft("");
  }

  return (
    <aside aria-labelledby="assistant-title" className="self-start rounded-3xl border border-[var(--stroke)] bg-white p-5 shadow-[var(--shadow)] xl:sticky xl:top-6">
      <h2 id="assistant-title" className="font-display text-xl font-semibold">Board assistant</h2>
      <div className="mt-3 h-1 w-10 rounded-full bg-[var(--accent-yellow)]" />
      <div ref={transcript} role="log" aria-label="Conversation" className="my-4 flex max-h-96 min-h-24 flex-col gap-3 overflow-y-auto text-sm">
        {messages.length === 0 && <p className="text-slate-600">Ask about the board or tell the assistant to create, edit, or move cards.</p>}
        {messages.map((message, index) => (
          <p key={index} className={`whitespace-pre-wrap break-words rounded-xl p-3 ${message.role === "user" ? "ml-4 bg-sky-50" : "mr-4 bg-purple-50"}`}>
            <span className="mb-1 block text-xs font-semibold">{message.role === "user" ? "You" : "Assistant"}</span>
            {message.content}
          </p>
        ))}
        {pending && <p>Thinking…</p>}
      </div>
      <form onSubmit={submit} className="grid gap-3">
        <textarea aria-label="Message" placeholder="Message the assistant" className="workspace-input resize-y" rows={3} value={draft} disabled={pending} onChange={(event) => setDraft(event.target.value)} />
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <button className="workspace-primary" disabled={busy || !draft.trim()}>Send</button>
      </form>
    </aside>
  );
}
