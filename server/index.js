const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const { loadRoomFromDisk, scheduleRoomSave } = require("./roomStore");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" , methods: ["GET", "POST"] } });

const rooms = {};

const DEFAULT_FILES = { "main.js": "// Start coding together...\n" };
const DEFAULT_ACTIVE_FILE = "main.js";
const DEFAULT_LANGUAGE_ID = 63;

const JUDGE0_RAPID_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_CE_URL = "https://ce.judge0.com";

function normalizePath(p) {
  return String(p).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

function createRoomState(overrides = {}) {
  return {
    users: [],
    files: { ...DEFAULT_FILES },
    folders: [],
    activeFile: DEFAULT_ACTIVE_FILE,
    languageId: DEFAULT_LANGUAGE_ID,
    chat: [],
    ...overrides,
  };
}

function getRoomSnapshot(room) {
  return {
    files: room.files,
    folders: room.folders || [],
    activeFile: room.activeFile,
    languageId: room.languageId,
    chat: room.chat || [],
  };
}

function persist(roomId) {
  const room = rooms[roomId];
  if (room) scheduleRoomSave(roomId, room);
}

function removeUserFromRooms(socketId) {
  for (const roomId of Object.keys(rooms)) {
    const room = rooms[roomId];
    const before = room.users.length;
    room.users = room.users.filter((u) => u.socketId !== socketId);
    if (room.users.length !== before) {
      io.to(roomId).emit("users_update", room.users);
      io.to(roomId).emit("cursor_clear", { socketId });
    }
  }
}

async function runOnJudge0(code, languageId) {
  const rapidKey = process.env.JUDGE0_API_KEY || "";
  if (rapidKey) {
    const headers = {
      "X-RapidAPI-Key": rapidKey,
      "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json",
    };
    const submitResponse = await axios.post(
      `${JUDGE0_RAPID_URL}/submissions?base64_encoded=false&wait=true`,
      { source_code: code, language_id: languageId, stdin: "" },
      { headers, timeout: 30000 }
    );
    return submitResponse.data;
  }
  const ceResponse = await axios.post(
    `${JUDGE0_CE_URL}/submissions?base64_encoded=false&wait=true`,
    { source_code: code, language_id: languageId, stdin: "" },
    { headers: { "Content-Type": "application/json" }, timeout: 30000 }
  );
  return ceResponse.data;
}

function formatJudge0Result(result) {
  const status = result.status?.description || "Done";
  const stderr = result.stderr || result.compile_output || "";
  let stdout = result.stdout || "";
  if (status === "Accepted" && !stdout && !stderr) stdout = "(no output)";
  return { stdout, stderr, status };
}

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "CodeSync" });
});

app.get("/api/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  const exists = Boolean(rooms[roomId]) || Boolean(loadRoomFromDisk(roomId));
  res.json({ exists });
});

io.on("connection", (socket) => {
  socket.on("create_room", ({ roomId }, ack) => {
    if (!roomId) {
      if (typeof ack === "function") ack({ ok: false, error: "Invalid room ID" });
      return;
    }
    if (!rooms[roomId]) {
      const disk = loadRoomFromDisk(roomId);
      rooms[roomId] = disk
        ? createRoomState({
            files: disk.files || DEFAULT_FILES,
            folders: disk.folders || [],
            activeFile: disk.activeFile || DEFAULT_ACTIVE_FILE,
            languageId: disk.languageId || DEFAULT_LANGUAGE_ID,
            chat: disk.chat || [],
          })
        : createRoomState();
    }
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("join_room", ({ roomId, username }, ack) => {
    if (!roomId || !username) {
      if (typeof ack === "function") ack({ ok: false, error: "Missing room or username" });
      return;
    }

    if (!rooms[roomId]) {
      const disk = loadRoomFromDisk(roomId);
      if (!disk) {
        socket.emit("join_error", { message: "Room does not exist. Create a new room first." });
        if (typeof ack === "function") ack({ ok: false, error: "Room not found" });
        return;
      }
      rooms[roomId] = createRoomState({
        files: disk.files,
        folders: disk.folders || [],
        activeFile: disk.activeFile,
        languageId: disk.languageId,
        chat: disk.chat || [],
      });
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = String(username).trim().slice(0, 24) || "Anonymous";

    const room = rooms[roomId];
    room.users = room.users.filter((u) => u.socketId !== socket.id);
    room.users.push({ socketId: socket.id, username: socket.data.username });

    const state = getRoomSnapshot(room);
    socket.emit("room_state", state);
    socket.emit("chat_history", room.chat || []);
    io.to(roomId).emit("users_update", room.users);
    if (typeof ack === "function") ack({ ok: true, state });
  });

  socket.on("code_change", ({ roomId, filename, code }) => {
    const room = rooms[roomId];
    if (!room || !filename) return;
    room.files[normalizePath(filename)] = code;
    socket.to(roomId).emit("code_update", { filename: normalizePath(filename), code });
    persist(roomId);
  });

  socket.on("file_create", ({ roomId, filename }) => {
    const room = rooms[roomId];
    const path = normalizePath(filename);
    if (!room || !path || room.files[path] !== undefined) return;
    room.files[path] = "";
    room.activeFile = path;
    io.to(roomId).emit("file_created", { filename: path, code: "", activeFile: path });
    persist(roomId);
  });

  socket.on("folder_create", ({ roomId, folderPath }) => {
    const room = rooms[roomId];
    const path = normalizePath(folderPath);
    if (!room || !path) return;
    if (!room.folders.includes(path)) {
      room.folders.push(path);
      room.folders.sort();
    }
    io.to(roomId).emit("folder_created", { folderPath: path });
    persist(roomId);
  });

  socket.on("file_rename", ({ roomId, oldPath, newPath }) => {
    const room = rooms[roomId];
    const oldP = normalizePath(oldPath);
    const newP = normalizePath(newPath);
    if (!room || !oldP || !newP || oldP === newP) return;

    const nextFiles = {};
    for (const [p, content] of Object.entries(room.files)) {
      if (p === oldP) nextFiles[newP] = content;
      else if (p.startsWith(oldP + "/")) nextFiles[newP + p.slice(oldP.length)] = content;
      else nextFiles[p] = content;
    }
    room.files = nextFiles;
    room.folders = room.folders.map((f) => {
      if (f === oldP) return newP;
      if (f.startsWith(oldP + "/")) return newP + f.slice(oldP.length);
      return f;
    });
    if (room.activeFile === oldP || room.activeFile.startsWith(oldP + "/")) {
      room.activeFile =
        room.activeFile === oldP
          ? newP
          : newP + room.activeFile.slice(oldP.length);
    }
    io.to(roomId).emit("file_renamed", { oldPath: oldP, newPath: newP, activeFile: room.activeFile });
    persist(roomId);
  });

  socket.on("file_delete", ({ roomId, filename }) => {
    const room = rooms[roomId];
    const path = normalizePath(filename);
    if (!room) return;

    const isFolder = room.folders.includes(path);
    if (isFolder) {
      room.folders = room.folders.filter((f) => f !== path && !f.startsWith(path + "/"));
      const next = {};
      for (const [p, c] of Object.entries(room.files)) {
        if (p !== path && !p.startsWith(path + "/")) next[p] = c;
      }
      room.files = next;
    } else {
      if (!room.files[path]) return;
      const keys = Object.keys(room.files);
      if (keys.length <= 1) return;
      delete room.files[path];
    }

    if (!room.files[room.activeFile]) {
      room.activeFile = Object.keys(room.files)[0] || DEFAULT_ACTIVE_FILE;
    }
    io.to(roomId).emit("file_deleted", {
      filename: path,
      activeFile: room.activeFile,
      isFolder,
    });
    persist(roomId);
  });

  socket.on("file_switch", ({ roomId, filename }) => {
    const room = rooms[roomId];
    const path = normalizePath(filename);
    if (!room || !room.files[path]) return;
    room.activeFile = path;
    io.to(roomId).emit("file_switch", path);
    persist(roomId);
  });

  socket.on("language_change", ({ roomId, languageId }) => {
    const room = rooms[roomId];
    if (!room || !languageId) return;
    room.languageId = languageId;
    io.to(roomId).emit("language_change", languageId);
    persist(roomId);
  });

  socket.on("cursor_move", ({ roomId, file, line, column }) => {
    if (!rooms[roomId]) return;
    socket.to(roomId).emit("cursor_update", {
      socketId: socket.id,
      username: socket.data.username || "User",
      file: normalizePath(file),
      line,
      column,
    });
  });

  socket.on("user_activity", ({ roomId, file, typing }) => {
    if (!rooms[roomId]) return;
    socket.to(roomId).emit("user_activity", {
      socketId: socket.id,
      username: socket.data.username || "User",
      file: normalizePath(file),
      typing: Boolean(typing),
    });
  });

  socket.on("chat_message", ({ roomId, message }) => {
    const room = rooms[roomId];
    const text = String(message || "").trim().slice(0, 500);
    if (!room || !text) return;
    const entry = {
      id: `${Date.now()}-${socket.id}`,
      username: socket.data.username || "User",
      message: text,
      at: new Date().toISOString(),
    };
    room.chat.push(entry);
    if (room.chat.length > 100) room.chat = room.chat.slice(-100);
    io.to(roomId).emit("chat_message", entry);
    persist(roomId);
  });

  socket.on("run_code", async ({ roomId, code, languageId }) => {
    if (!rooms[roomId]) return;
    io.to(roomId).emit("run_output", { stdout: "", stderr: "", status: "Running..." });
    if (!code || !code.trim()) {
      io.to(roomId).emit("run_output", {
        stdout: "",
        stderr: "No code to execute.",
        status: "Error",
      });
      return;
    }
    try {
      const result = await runOnJudge0(code, languageId);
      io.to(roomId).emit("run_output", formatJudge0Result(result));
    } catch (error) {
      const detail =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Execution failed";
      io.to(roomId).emit("run_output", {
        stdout: "",
        stderr: `Execution error: ${detail}`,
        status: "Error",
      });
    }
  });

  socket.on("disconnect", () => {
    removeUserFromRooms(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`CodeSync server running on port ${PORT}`);
});
