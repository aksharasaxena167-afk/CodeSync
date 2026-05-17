import { useState } from "react";

export default function UsernameModal({ onSubmit }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-codesync-border bg-codesync-panel p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-white">Welcome to CodeSync</h2>
          <p className="mt-2 text-sm text-gray-400">Choose a display name for this session</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your username"
            autoFocus
            maxLength={24}
            className="w-full rounded-lg border border-codesync-border bg-codesync-bg px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-codesync-accent focus:ring-1 focus:ring-codesync-accent"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-lg bg-codesync-accent py-3 font-medium text-white transition hover:bg-codesync-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}