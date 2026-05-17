import { debounce } from "lodash";

const PREFIX = "codesync_room_";

export function loadRoomDraft(roomId) {
  if (!roomId) return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}${roomId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveRoomDraft(roomId, state) {
  if (!roomId || !state) return;
  try {
    localStorage.setItem(
      `${PREFIX}${roomId}`,
      JSON.stringify({ ...state, savedAt: Date.now() })
    );
  } catch {
    /* quota exceeded – ignore */
  }
}

export function createDebouncedRoomSave(delay = 800) {
  return debounce((roomId, state) => saveRoomDraft(roomId, state), delay);
}

export function loadTheme() {
  return localStorage.getItem("codesync_theme") || "dark";
}

export function saveTheme(theme) {
  localStorage.setItem("codesync_theme", theme);
}
