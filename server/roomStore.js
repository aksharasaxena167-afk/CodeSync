const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data", "rooms");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function roomFilePath(roomId) {
  return path.join(DATA_DIR, `${roomId}.json`);
}

function loadRoomFromDisk(roomId) {
  try {
    ensureDataDir();
    const file = roomFilePath(roomId);
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return data;
  } catch {
    return null;
  }
}

function saveRoomToDisk(roomId, room) {
  try {
    ensureDataDir();
    const payload = {
      files: room.files,
      folders: room.folders || [],
      activeFile: room.activeFile,
      languageId: room.languageId,
      chat: room.chat || [],
      updatedAt: Date.now(),
    };
    fs.writeFileSync(roomFilePath(roomId), JSON.stringify(payload, null, 2));
  } catch {
    /* ignore disk errors */
  }
}

const saveTimers = {};

function scheduleRoomSave(roomId, room) {
  if (saveTimers[roomId]) clearTimeout(saveTimers[roomId]);
  saveTimers[roomId] = setTimeout(() => {
    saveRoomToDisk(roomId, room);
    delete saveTimers[roomId];
  }, 1500);
}

module.exports = { loadRoomFromDisk, saveRoomToDisk, scheduleRoomSave };
