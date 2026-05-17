import { LANGUAGES } from "../constants/languages";
import DownloadMenu from "./DownloadMenu";
import { useTheme } from "../contexts/ThemeContext";

export default function Topbar({
  roomId,
  languageId,
  onLanguageChange,
  onRun,
  onCopyLink,
  copyFeedback,
  files,
  activeFile,
  chatOpen,
  onToggleChat,
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-codesync-border bg-codesync-panel px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-codesync-accent text-sm font-bold text-white">CS</span>
          <span className="text-base font-semibold tracking-tight text-white">CodeSync</span>
        </div>
        <div className="hidden items-center gap-2 rounded-md border border-codesync-border bg-codesync-bg px-3 py-1 sm:flex">
          <span className="text-xs text-gray-500">Room</span>
          <code className="font-mono text-sm text-codesync-accent">{roomId}</code>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={languageId}
          onChange={(e) => onLanguageChange(Number(e.target.value))}
          className="rounded-md border border-codesync-border bg-codesync-bg px-3 py-1.5 text-sm text-gray-200 outline-none transition hover:border-gray-500 focus:border-codesync-accent"
          aria-label="Programming language"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>{lang.name}</option>
          ))}
        </select>

        <DownloadMenu files={files} activeFile={activeFile} roomId={roomId} />

        <button type="button" onClick={onToggleChat} className={`rounded-md border px-3 py-1.5 text-sm transition ${chatOpen ? "border-codesync-accent text-codesync-accent" : "border-codesync-border text-gray-300 hover:text-white"}`}>
          Chat
        </button>

        <button type="button" onClick={toggleTheme} className="rounded-md border border-codesync-border bg-codesync-bg px-3 py-1.5 text-sm text-gray-300 hover:text-white" title="Toggle theme">
          {theme === "dark" ? "☀" : "☾"}
        </button>

        <button type="button" onClick={onCopyLink} className="rounded-md border border-codesync-border bg-codesync-bg px-3 py-1.5 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white">
          {copyFeedback ? "Copied!" : "Copy Room Link"}
        </button>

        <button type="button" onClick={onRun} className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500">
          <span aria-hidden>▶</span> Run Code
        </button>
      </div>
    </header>
  );
}
