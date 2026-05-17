import { useEffect, useRef, useState } from "react";
import { downloadFile, downloadProject } from "../utils/download";

export default function DownloadMenu({ files, activeFile, roomId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-codesync-border bg-codesync-bg px-3 py-1.5 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
      >
        Download ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-codesync-border bg-codesync-panel py-1 shadow-xl">
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white"
            onClick={() => {
              downloadFile(activeFile, files[activeFile] ?? "");
              setOpen(false);
            }}
          >
            Current file
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white"
            onClick={async () => {
              await downloadProject(files, roomId);
              setOpen(false);
            }}
          >
            Project (.zip)
          </button>
        </div>
      )}
    </div>
  );
}
