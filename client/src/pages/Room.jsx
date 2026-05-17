import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import EditorPanel from "../components/EditorPanel";
import OutputPanel from "../components/OutputPanel";
import ChatPanel from "../components/ChatPanel";
import UsernameModal from "../components/UsernameModal";
import { useRoomSocket } from "../hooks/useRoomSocket";

export default function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isCreate =
    location.state?.isCreate === true ||
    sessionStorage.getItem("codesync_create_room") === roomId;

  useEffect(() => {
    if (sessionStorage.getItem("codesync_create_room") === roomId) {
      sessionStorage.removeItem("codesync_create_room");
    }
  }, [roomId]);

  const [username, setUsername] = useState(() => localStorage.getItem("codesync_username") || "");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleUsername = (name) => {
    localStorage.setItem("codesync_username", name);
    setUsername(name);
  };

  const {
    files, folders, activeFile, languageId, output, users, joinError, roomReady,
    remoteCursors, userActivities, chatMessages, socketId,
    handleCodeChange, handleCursorMove, handleFileSelect, handleFileCreate,
    handleFolderCreate, handleFileRename, handleFileDelete, handleLanguageChange,
    handleRun, sendChatMessage,
  } = useRoomSocket(roomId, username, { isCreate });

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      window.prompt("Copy this room link:", url);
    }
  }, [roomId]);

  if (!username) return <UsernameModal onSubmit={handleUsername} />;

  if (joinError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-codesync-bg px-4">
        <div className="max-w-md rounded-xl border border-red-500/30 bg-codesync-panel p-8 text-center">
          <p className="text-lg font-medium text-red-400">Could not enter room</p>
          <p className="mt-2 text-sm text-gray-400">{joinError}</p>
          <button type="button" onClick={() => navigate("/")} className="mt-6 rounded-lg bg-codesync-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-codesync-accent-hover">Back to Home</button>
        </div>
      </div>
    );
  }

  if (!roomReady) {
    return (
      <div className="flex h-full items-center justify-center bg-codesync-bg text-gray-400">
        <p className="animate-pulse">Connecting to room…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-codesync-bg">
      <Topbar
        roomId={roomId}
        languageId={languageId}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        onCopyLink={handleCopyLink}
        copyFeedback={copyFeedback}
        files={files}
        activeFile={activeFile}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((o) => !o)}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          <Sidebar
            files={files}
            folders={folders}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
            onFileCreate={handleFileCreate}
            onFolderCreate={handleFolderCreate}
            onFileDelete={handleFileDelete}
            onFileRename={handleFileRename}
            users={users}
            userActivities={userActivities}
            socketId={socketId}
          />
          <EditorPanel
            value={files[activeFile] ?? ""}
            onChange={handleCodeChange}
            activeFile={activeFile}
            onCursorMove={handleCursorMove}
            remoteCursors={remoteCursors}
            currentSocketId={socketId}
          />
          {chatOpen && (
            <ChatPanel
              messages={chatMessages}
              onSend={sendChatMessage}
              onClose={() => setChatOpen(false)}
            />
          )}
        </div>
        <OutputPanel output={output} />
      </div>
    </div>
  );
}
