import FileExplorer from "./FileExplorer";
import UserList from "./UserList";
import ActivityBar from "./ActivityBar";

export default function Sidebar({
  files,
  folders,
  activeFile,
  onFileSelect,
  onFileCreate,
  onFolderCreate,
  onFileDelete,
  onFileRename,
  users,
  userActivities,
  socketId,
}) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-codesync-border bg-codesync-sidebar">
      <div className="border-b border-codesync-border px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Explorer
        </h2>
      </div>

      <FileExplorer
        files={files}
        folders={folders}
        activeFile={activeFile}
        onFileSelect={onFileSelect}
        onFileCreate={onFileCreate}
        onFolderCreate={onFolderCreate}
        onFileDelete={onFileDelete}
        onFileRename={onFileRename}
      />

      <ActivityBar activities={userActivities} currentSocketId={socketId} />

      <UserList users={users} />
    </aside>
  );
}
