export default function ActivityBar({ activities, currentSocketId }) {
  const list = Object.values(activities || {}).filter((a) => a.socketId !== currentSocketId);

  if (list.length === 0) return null;

  return (
    <div className="border-t border-codesync-border px-3 py-2">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
        Activity
      </p>
      <ul className="max-h-20 space-y-1 overflow-y-auto">
        {list.map((a) => (
          <li key={a.socketId} className="truncate text-xs text-gray-500">
            <span className="text-gray-400">{a.username}</span>
            {a.typing ? (
              <span className="text-codesync-accent"> typing in {a.file}…</span>
            ) : (
              <span> viewing {a.file}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
