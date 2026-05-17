import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkRoomExists } from "../lib/api";
import { useTheme } from "../contexts/ThemeContext";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

export default function Home() {
  const navigate = useNavigate();
  const { toggleTheme, theme } = useTheme();
  const [joinId, setJoinId] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const createRoom = () => {
    const id = generateRoomId();
    sessionStorage.setItem("codesync_create_room", id);
    navigate(`/room/${id}`, { state: { isCreate: true } });
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    const id = joinId.trim();
    if (!id) return;
    setJoinError("");
    setJoinLoading(true);
    try {
      const exists = await checkRoomExists(id);
      if (!exists) {
        setJoinError("Room not found. Double-check the ID or create a new room.");
        return;
      }
      navigate(`/room/${id}`);
    } catch (err) {
      setJoinError(err.message || "Failed to check room.");
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="min-h-full overflow-y-auto bg-codesync-bg text-gray-200">
      <nav className="sticky top-0 z-10 border-b border-codesync-border/80 bg-codesync-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-semibold text-white">CodeSync</span>
          <div className="flex gap-2">
            <button type="button" onClick={toggleTheme} className="rounded-lg border border-codesync-border px-3 py-2 text-sm">
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button type="button" onClick={createRoom} className="rounded-lg bg-codesync-accent px-4 py-2 text-sm font-medium text-white">
              Start Coding
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-5xl font-bold text-white">
          Code together. <span className="text-codesync-accent">Ship faster.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-400">
          Real-time collaborative IDE with multi-file workspaces, live cursors, chat, and code execution.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={createRoom} className="rounded-xl bg-codesync-accent px-8 py-3 font-semibold text-white">
            Create New Room
          </button>
        </div>

        <section id="join" className="mt-16 max-w-md rounded-2xl border border-codesync-border bg-codesync-panel p-8">
          <h2 className="text-xl font-semibold text-white">Join a room</h2>
          <form onSubmit={joinRoom} className="mt-4 space-y-3">
            <input
              type="text"
              value={joinId}
              onChange={(e) => { setJoinId(e.target.value); setJoinError(""); }}
              placeholder="Room ID"
              className="w-full rounded-lg border border-codesync-border bg-codesync-bg px-4 py-3 text-white outline-none focus:border-codesync-accent"
            />
            {joinError && <p className="text-sm text-red-400">{joinError}</p>}
            <button type="submit" disabled={!joinId.trim() || joinLoading} className="w-full rounded-lg border border-codesync-border py-3 text-sm disabled:opacity-40">
              {joinLoading ? "Checking…" : "Join Room"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
