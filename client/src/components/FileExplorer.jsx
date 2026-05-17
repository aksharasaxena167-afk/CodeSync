import { useMemo, useState } from "react";
import { buildFileTree, joinPath, normalizePath } from "../utils/fileTree";

function fileIcon(name) {
  if (name.endsWith(".py")) return "🐍";
  if (name.endsWith(".cpp") || name.endsWith(".cc")) return "⚙️";
  return "📄";
}

function TreeNode({
  node,
  depth,
  activeFile,
  expanded,
  onToggle,
  onFileSelect,
  onFileDelete,
  onFileRename,
  onFolderDelete,
}) {
  const pad = { paddingLeft: `${depth * 12 + 8}px` };

  if (node.type === "folder") {
    const isOpen = expanded.has(node.path);
    return (
      <>
        <li className="group flex items-center pr-1" style={pad}>
          <button
            type="button"
            onClick={() => onToggle(node.path)}
            className="flex min-w-0 flex-1 items-center gap-1 py-1 text-left text-sm text-gray-400 hover:text-gray-200"
          >
            <span className="text-xs">{isOpen ? "▼" : "▶"}</span>
            <span>📁</span>
            <span className="truncate font-mono">{node.name}</span>
          </button>
          <button
            type="button"
            onClick={() => onFolderDelete(node.path)}
            title="Delete folder"
            className="rounded px-1 text-xs text-gray-600 opacity-0 hover:text-red-400 group-hover:opacity-100"
          >
            ×
          </button>
        </li>
        {isOpen &&
          node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              expanded={expanded}
              onToggle={onToggle}
              onFileSelect={onFileSelect}
              onFileDelete={onFileDelete}
              onFileRename={onFileRename}
              onFolderDelete={onFolderDelete}
            />
          ))}
      </>
    );
  }

  return (
    <li className="group flex items-center pr-1" style={pad}>
      <button
        type="button"
        onClick={() => onFileSelect(node.path)}
        className={`flex min-w-0 flex-1 items-center gap-2 py-1 text-left text-sm transition ${
          activeFile === node.path
            ? "bg-codesync-accent/20 text-white"
            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
        }`}
      >
        <span className="text-xs opacity-70">{fileIcon(node.name)}</span>
        <span className="truncate font-mono">{node.name}</span>
      </button>
      <button
        type="button"
        onClick={() => {
          const next = window.prompt("Rename file", node.name);
          if (next && next !== node.name) {
            const parent = node.path.includes("/")
              ? node.path.slice(0, node.path.lastIndexOf("/"))
              : "";
            onFileRename(node.path, joinPath(parent, next));
          }
        }}
        title="Rename"
        className="rounded px-1 text-xs text-gray-600 opacity-0 hover:text-gray-300 group-hover:opacity-100"
      >
        ✎
      </button>
      <button
        type="button"
        onClick={() => onFileDelete(node.path)}
        title="Delete"
        className="rounded px-1 text-xs text-gray-600 opacity-0 hover:text-red-400 group-hover:opacity-100"
      >
        ×
      </button>
    </li>
  );
}

export default function FileExplorer({
  files,
  folders,
  activeFile,
  onFileSelect,
  onFileCreate,
  onFolderCreate,
  onFileDelete,
  onFileRename,
}) {
  const [newName, setNewName] = useState("");
  const [createMode, setCreateMode] = useState("file");
  const [expanded, setExpanded] = useState(() => new Set());

  const tree = useMemo(() => buildFileTree(files, folders), [files, folders]);

  const toggle = (path) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const trimmed = normalizePath(newName);
    if (!trimmed) return;
    if (createMode === "folder") {
      onFolderCreate(trimmed);
    } else {
      if (files[trimmed]) return;
      onFileCreate(trimmed);
    }
    setNewName("");
    const parent = trimmed.includes("/") ? trimmed.slice(0, trimmed.lastIndexOf("/")) : "";
    if (parent) setExpanded((p) => new Set([...p, parent]));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex gap-1 border-b border-codesync-border p-2">
        <select
          value={createMode}
          onChange={(e) => setCreateMode(e.target.value)}
          className="rounded border border-codesync-border bg-codesync-bg px-1 text-xs text-gray-400"
        >
          <option value="file">File</option>
          <option value="folder">Folder</option>
        </select>
        <form onSubmit={handleCreate} className="flex min-w-0 flex-1 gap-1">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={createMode === "folder" ? "src" : "src/app.js"}
            className="min-w-0 flex-1 rounded border border-codesync-border bg-codesync-bg px-2 py-1 text-xs text-white placeholder-gray-600 outline-none focus:border-codesync-accent"
          />
          <button
            type="submit"
            className="rounded bg-codesync-accent px-2 py-1 text-xs font-medium text-white hover:bg-codesync-accent-hover"
          >
            +
          </button>
        </form>
      </div>

      <ul className="flex-1 overflow-y-auto py-1">
        {tree.map((node) => (
          <TreeNode
            key={node.path || node.name}
            node={node}
            depth={0}
            activeFile={activeFile}
            expanded={expanded}
            onToggle={toggle}
            onFileSelect={onFileSelect}
            onFileDelete={onFileDelete}
            onFileRename={onFileRename}
            onFolderDelete={onFileDelete}
          />
        ))}
      </ul>
    </div>
  );
}
