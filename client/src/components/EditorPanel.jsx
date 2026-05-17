import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { getMonacoLanguage } from "../constants/languages";
import { useTheme } from "../contexts/ThemeContext";
import { colorForUser } from "../utils/userColors";

export default function EditorPanel({
  value,
  onChange,
  activeFile,
  onCursorMove,
  remoteCursors,
  currentSocketId,
}) {
  const { theme } = useTheme();
  const language = getMonacoLanguage(activeFile);
  const onChangeRef = useRef(onChange);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIdsRef = useRef([]);

  onChangeRef.current = onChange;

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const decorations = Object.values(remoteCursors || {})
      .filter((c) => c.socketId !== currentSocketId && c.file === activeFile && c.line)
      .map((c) => ({
        range: new monaco.Range(c.line, c.column || 1, c.line, (c.column || 1) + 1),
        options: {
          overviewRuler: {
            color: colorForUser(c.socketId),
            position: monaco.editor.OverviewRulerLane.Full,
          },
          glyphMarginClassName: "remote-cursor-glyph",
          glyphMarginHoverMessage: { value: c.username },
        },
      }));

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      decorations
    );
  }, [remoteCursors, activeFile, currentSocketId]);

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.onDidChangeCursorPosition((e) => {
      onCursorMove?.(e.position);
    });
  };

  return (
    <section className="relative min-h-0 min-w-0 flex-1 bg-codesync-bg">
      <div className="absolute inset-0 flex flex-col">
        <div className="flex h-9 shrink-0 items-center border-b border-codesync-border bg-codesync-panel px-4">
          <span className="font-mono text-sm text-gray-400">{activeFile}</span>
        </div>
        <div className="min-h-0 flex-1">
          <Editor
            key={activeFile}
            path={activeFile}
            height="100%"
            language={language}
            value={value}
            onChange={(v) => onChangeRef.current(v)}
            theme={theme === "light" ? "vs" : "vs-dark"}
            onMount={handleMount}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12 },
              lineNumbers: "on",
              renderLineHighlight: "all",
              cursorBlinking: "smooth",
              glyphMargin: true,
            }}
          />
        </div>
      </div>
    </section>
  );
}
