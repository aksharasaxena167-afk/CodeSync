const API_URL = import.meta.env.VITE_SOCKET_URL || "https://codesync-backend-rx0w.onrender.com";

export async function checkRoomExists(roomId) {
  const response = await fetch(`${API_URL}/api/rooms/${encodeURIComponent(roomId)}`);
  if (!response.ok) {
    throw new Error("Could not reach server. Is the backend running?");
  }
  const data = await response.json();
  return Boolean(data.exists);
}
