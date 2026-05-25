import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "lodash";
import { socket } from "../lib/socket";
import { DEFAULT_LANGUAGE_ID } from "../constants/languages";
import { createDebouncedRoomSave, loadRoomDraft } from "../lib/persistence";
import {
  deleteFolderFromList,
  deletePathFromFiles,
  normalizePath,
  renameFolders,
  renamePathInFiles,
} from "../utils/fileTree";

function registerSocketHandlers(handlers) {
  const events = [
    ["room_state", handlers.onRoomState],
    ["code_update", handlers.onCodeUpdate],
    ["file_created", handlers.onFileCreated],
    ["file_deleted", handlers.onFileDeleted],
    ["file_renamed", handlers.onFileRenamed],
    ["folder_created", handlers.onFolderCreated],
    ["file_switch", handlers.onFileSwitch],
    ["language_change", handlers.onLanguageChange],
    ["users_update", handlers.onUsersUpdate],
    ["run_output", handlers.onRunOutput],
    ["join_error", handlers.onJoinError],
    ["cursor_update", handlers.onCursorUpdate],
    ["cursor_clear", handlers.onCursorClear],
    ["user_activity", handlers.onUserActivity],
    ["chat_message", handlers.onChatMessage],
    ["chat_history", handlers.onChatHistory],
  ];
  events.forEach(([e, h]) => socket.on(e, h));
  return events;
}

function unregisterSocketHandlers(events) {
  events.forEach(([e, h]) => socket.off(e, h));
}

export function useRoomSocket(roomId, username, { isCreate = false } = {}) {
  const draft = useMemo(() => loadRoomDraft(roomId), [roomId]);

  const [files, setFiles] = useState(draft?.files || {});
  const [folders, setFolders] = useState(draft?.folders || []);
  const [activeFile, setActiveFile] = useState(draft?.activeFile || "main.js");
  const [languageId, setLanguageId] = useState(draft?.languageId || DEFAULT_LANGUAGE_ID);
  const [output, setOutput] = useState({ stdout: "", stderr: "", status: "" });
  const [users, setUsers] = useState([]);
  const [connected, setConnected] = useState(socket.connected);
  const [joinError, setJoinError] = useState(null);
  const [roomReady, setRoomReady] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [userActivities, setUserActivities] = useState({});
  const [chatMessages, setChatMessages] = useState(draft?.chat || []);

  const roomIdRef = useRef(roomId);
  const activeFileRef = useRef(activeFile);
  const languageIdRef = useRef(languageId);
  const filesRef = useRef(files);
  const foldersRef = useRef(folders);
  const isRemoteUpdate = useRef(false);
  const debouncedSave = useMemo(() => createDebouncedRoomSave(800), []);

  roomIdRef.current = roomId;
  activeFileRef.current = activeFile;
  languageIdRef.current = languageId;
  filesRef.current = files;
  foldersRef.current = folders;

  useEffect(() => {
    if (!roomReady || !roomId) return;
    debouncedSave(roomId, {
      files,
      folders,
      activeFile,
      languageId,
      chat: chatMessages,
    });
  }, [files, folders, activeFile, languageId, chatMessages, roomId, roomReady, debouncedSave]);

  useEffect(() => {
    if (!roomId || !username) return;

    let cancelled = false;
    setJoinError(null);
    setRoomReady(false);

    const applyRoomState = (state) => {
      if (cancelled || !state) return;
      setFiles(state.files || {});
      setFolders(state.folders || []);
      setActiveFile(state.activeFile || "main.js");
      if (state.languageId) setLanguageId(state.languageId);
      if (state.chat) setChatMessages(state.chat);
      setRoomReady(true);
    };

    const handlers = {
      onRoomState: applyRoomState,
      onCodeUpdate: ({ filename, code }) => {
        isRemoteUpdate.current = true;
        setFiles((prev) => ({ ...prev, [filename]: code }));
        requestAnimationFrame(() => {
          isRemoteUpdate.current = false;
        });
      },
      onFileCreated: ({ filename, code, activeFile: newActive }) => {
        setFiles((prev) => ({ ...prev, [filename]: code }));
        setActiveFile(newActive);
      },
      onFileDeleted: ({ filename, activeFile: newActive, isFolder }) => {
        if (isFolder) {
          setFolders((prev) => deleteFolderFromList(prev, filename));
          setFiles((prev) => deletePathFromFiles(prev, filename));
        } else {
          setFiles((prev) => {
            const next = { ...prev };
            delete next[filename];
            return next;
          });
        }
        setActiveFile(newActive);
      },
      onFileRenamed: ({ oldPath, newPath, activeFile: newActive }) => {
        setFiles((prev) => renamePathInFiles(prev, oldPath, newPath));
        setFolders((prev) => renameFolders(prev, oldPath, newPath));
        setActiveFile(newActive);
      },
      onFolderCreated: ({ folderPath }) => {
        setFolders((prev) => (prev.includes(folderPath) ? prev : [...prev, folderPath].sort()));
      },
      onFileSwitch: (filename) => setActiveFile(filename),
      onLanguageChange: (id) => setLanguageId(id),
      onUsersUpdate: (usersList) => setUsers(usersList),
      onRunOutput: (result) => setOutput(result),
      onJoinError: ({ message }) => {
        setJoinError(message || "Could not join room");
        setRoomReady(false);
      },
      onCursorUpdate: (data) => {
        setRemoteCursors((prev) => ({ ...prev, [data.socketId]: data }));
      },
      onCursorClear: ({ socketId }) => {
        setRemoteCursors((prev) => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      },
      onUserActivity: (data) => {
        setUserActivities((prev) => ({ ...prev, [data.socketId]: data }));
      },
      onChatMessage: (entry) => {
        setChatMessages((prev) => [...prev, entry]);
      },
      onChatHistory: (history) => {
        if (Array.isArray(history)) setChatMessages(history);
      },
    };

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err) => {
      if (cancelled) return;
      setJoinError(
        `Cannot reach server at ${import.meta.env.VITE_SOCKET_URL || "https://codesync-backend-rx0w.onrender.com"}. ${err.message}`
      );
    };

    const joinRoom = () => {
      socket.emit("join_room", { roomId, username }, (joinRes) => {
        if (cancelled) return;
        if (joinRes?.ok) applyRoomState(joinRes.state);
        else setJoinError(joinRes?.error || "Failed to join room");
      });
    };

    const enterRoom = () => {
      if (cancelled) return;
      if (isCreate) {
        socket.emit("create_room", { roomId }, (res) => {
          if (cancelled) return;
          if (!res?.ok) {
            setJoinError(res?.error || "Failed to create room");
            return;
          }
          joinRoom();
        });
      } else {
        joinRoom();
      }
    };

    const onReconnect = () => enterRoom();
    const socketEvents = registerSocketHandlers(handlers);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) enterRoom();
    else socket.once("connect", enterRoom);

    socket.io.on("reconnect", onReconnect);

    return () => {
      cancelled = true;
      socket.off("connect", enterRoom);
      socket.io.off("reconnect", onReconnect);
      unregisterSocketHandlers(socketEvents);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [roomId, username, isCreate]);

  const debouncedCodeChange = useMemo(
    () =>
      debounce((filename, code) => {
        socket.emit("code_change", { roomId: roomIdRef.current, filename, code });
      }, 200),
    []
  );

  const debouncedCursor = useMemo(
    () =>
      debounce((file, line, column) => {
        socket.emit("cursor_move", {
          roomId: roomIdRef.current,
          file,
          line,
          column,
        });
      }, 80),
    []
  );

  const debouncedActivity = useMemo(
    () =>
      debounce((file, typing) => {
        socket.emit("user_activity", {
          roomId: roomIdRef.current,
          file,
          typing,
        });
      }, 300),
    []
  );

  useEffect(
    () => () => {
      debouncedCodeChange.cancel();
      debouncedCursor.cancel();
      debouncedActivity.cancel();
    },
    [debouncedCodeChange, debouncedCursor, debouncedActivity]
  );

  const handleCodeChange = useCallback(
    (value) => {
      const code = value ?? "";
      const filename = activeFileRef.current;
      setFiles((prev) => ({ ...prev, [filename]: code }));
      if (!isRemoteUpdate.current) {
        debouncedCodeChange(filename, code);
        debouncedActivity(filename, true);
      }
    },
    [debouncedCodeChange, debouncedActivity]
  );

  const handleCursorMove = useCallback(
    (position) => {
      if (!position) return;
      debouncedCursor(activeFileRef.current, position.lineNumber, position.column);
    },
    [debouncedCursor]
  );

  const handleFileSelect = useCallback((filename) => {
    setActiveFile(filename);
    socket.emit("file_switch", { roomId: roomIdRef.current, filename });
    debouncedActivity(filename, false);
  }, [debouncedActivity]);

  const handleFileCreate = useCallback((filename) => {
    socket.emit("file_create", { roomId: roomIdRef.current, filename: normalizePath(filename) });
  }, []);

  const handleFolderCreate = useCallback((folderPath) => {
    socket.emit("folder_create", { roomId: roomIdRef.current, folderPath: normalizePath(folderPath) });
  }, []);

  const handleFileRename = useCallback((oldPath, newPath) => {
    socket.emit("file_rename", {
      roomId: roomIdRef.current,
      oldPath: normalizePath(oldPath),
      newPath: normalizePath(newPath),
    });
  }, []);

  const handleFileDelete = useCallback((path) => {
    socket.emit("file_delete", { roomId: roomIdRef.current, filename: normalizePath(path) });
  }, []);

  const handleLanguageChange = useCallback((id) => {
    setLanguageId(id);
    socket.emit("language_change", { roomId: roomIdRef.current, languageId: id });
  }, []);

  const handleRun = useCallback(() => {
    const filename = activeFileRef.current;
    const code = filesRef.current[filename] ?? "";
    setOutput({ stdout: "", stderr: "", status: "Running..." });
    socket.emit("run_code", {
      roomId: roomIdRef.current,
      code,
      languageId: languageIdRef.current,
    });
  }, []);

  const sendChatMessage = useCallback((message) => {
    socket.emit("chat_message", { roomId: roomIdRef.current, message });
  }, []);

  return {
    files,
    folders,
    activeFile,
    languageId,
    output,
    users,
    connected,
    joinError,
    roomReady,
    remoteCursors,
    userActivities,
    chatMessages,
    socketId: socket.id,
    handleCodeChange,
    handleCursorMove,
    handleFileSelect,
    handleFileCreate,
    handleFolderCreate,
    handleFileRename,
    handleFileDelete,
    handleLanguageChange,
    handleRun,
    sendChatMessage,
  };
}
