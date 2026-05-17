export default function UserList({ users }) {
  return (
    <div className="border-t border-codesync-border p-3">
      <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Collaborators ({users.length})
      </h3>
      <ul className="max-h-36 space-y-1 overflow-y-auto">
        {users.length === 0 ? (
          <li className="px-2 py-1 text-sm text-gray-500">No users yet</li>
        ) : (
          users.map((user) => (
            <li
              key={user.socketId}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-300"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate">{user.username || "Anonymous"}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
