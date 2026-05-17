import JSZip from "jszip";

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadFile(path, content) {
  const blob = new Blob([content ?? ""], { type: "text/plain;charset=utf-8" });
  const name = path.includes("/") ? path.split("/").pop() : path;
  triggerDownload(blob, name);
}

export async function downloadProject(files, roomId = "project") {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content ?? "");
  }
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `codesync-${roomId}.zip`);
}
