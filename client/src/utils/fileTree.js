/** @typedef {{ type: 'file', path: string, name: string }} FileNode */
/** @typedef {{ type: 'folder', path: string, name: string, children: TreeNode[] }} FolderNode */
/** @typedef {FileNode | FolderNode} TreeNode */

export function normalizePath(p) {
  return p.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

export function joinPath(parent, name) {
  const base = normalizePath(parent || "");
  const n = normalizePath(name);
  if (!base) return n;
  if (!n) return base;
  return `${base}/${n}`;
}

export function getParentPath(filePath) {
  const p = normalizePath(filePath);
  const i = p.lastIndexOf("/");
  return i === -1 ? "" : p.slice(0, i);
}

export function getFileName(filePath) {
  const p = normalizePath(filePath);
  const i = p.lastIndexOf("/");
  return i === -1 ? p : p.slice(i + 1);
}

/**
 * Build explorer tree from flat files map + explicit folder paths.
 * @param {Record<string, string>} files
 * @param {string[]} folders
 * @returns {TreeNode[]}
 */
export function buildFileTree(files, folders = []) {
  const root = { type: "folder", path: "", name: "", children: new Map() };

  const ensureFolder = (folderPath) => {
    const parts = normalizePath(folderPath).split("/").filter(Boolean);
    let current = root;
    let built = "";
    for (const part of parts) {
      built = built ? `${built}/${part}` : part;
      if (!current.children.has(part)) {
        current.children.set(part, {
          type: "folder",
          path: built,
          name: part,
          children: new Map(),
        });
      }
      current = current.children.get(part);
    }
    return current;
  };

  for (const folderPath of folders) {
    ensureFolder(folderPath);
  }

  for (const filePath of Object.keys(files)) {
    const normalized = normalizePath(filePath);
    const parentPath = getParentPath(normalized);
    const parent = parentPath ? ensureFolder(parentPath) : root;
    const name = getFileName(normalized);
    parent.children.set(name, { type: "file", path: normalized, name });
  }

  const mapToArray = (node) => {
    const children = [...node.children.values()]
      .map((child) =>
        child.type === "folder"
          ? { ...child, children: mapToArray(child) }
          : child
      )
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    return children;
  };

  return mapToArray(root);
}

export function collectFolderPaths(tree) {
  const paths = [];
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.type === "folder" && node.path) {
        paths.push(node.path);
        walk(node.children);
      }
    }
  };
  walk(tree);
  return paths;
}

export function renamePathInFiles(files, oldPath, newPath) {
  const oldN = normalizePath(oldPath);
  const newN = normalizePath(newPath);
  const next = {};
  for (const [path, content] of Object.entries(files)) {
    if (path === oldN) {
      next[newN] = content;
    } else if (path.startsWith(oldN + "/")) {
      next[newN + path.slice(oldN.length)] = content;
    } else {
      next[path] = content;
    }
  }
  return next;
}

export function renameFolders(folders, oldPath, newPath) {
  const oldN = normalizePath(oldPath);
  const newN = normalizePath(newPath);
  const set = new Set();
  for (const f of folders) {
    if (f === oldN) set.add(newN);
    else if (f.startsWith(oldN + "/")) set.add(newN + f.slice(oldN.length));
    else set.add(f);
  }
  return [...set];
}

export function deletePathFromFiles(files, targetPath) {
  const t = normalizePath(targetPath);
  const next = {};
  for (const [path, content] of Object.entries(files)) {
    if (path !== t && !path.startsWith(t + "/")) {
      next[path] = content;
    }
  }
  return next;
}

export function deleteFolderFromList(folders, folderPath) {
  const t = normalizePath(folderPath);
  return folders.filter((f) => f !== t && !f.startsWith(t + "/"));
}
