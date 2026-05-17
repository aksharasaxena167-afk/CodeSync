import { useEffect, useRef, useState } from "react";

export default function ChatPanel({ messages, onSend, onClose }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    onSend(msg);
    setText("");
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-codesync-border bg-codesync-panel">
      <div className="flex h-10 items-center justify-between border-b border-codesync-border px-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Team Chat</span>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-white" aria-label="Close chat">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-600">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="rounded-lg bg-codesync-bg/80 px-2 py-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-codesync-accent">{m.username}</span>
              {m.at && (
                <span className="text-[10px] text-gray-600">
                  {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-300 break-words">{m.message}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="border-t border-codesync-border p-2">
        <div className="flex gap-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message…"
            className="min-w-0 flex-1 rounded border border-codesync-border bg-codesync-bg px-2 py-1.5 text-sm text-white outline-none focus:border-codesync-accent"
          />
          <button type="submit" className="rounded bg-codesync-accent px-3 text-sm text-white hover:bg-codesync-accent-hover">Send</button>
        </div>
      </form>
    </aside>
  );
}
