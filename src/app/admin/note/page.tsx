import { AdminShell } from "@/components/admin-shell";
import { NoteFolderManager } from "@/app/admin/note/folder-manager";
import { getAdminNoteFolders } from "@/lib/data/admin-notes";

export const dynamic = "force-dynamic";

export default async function AdminNotePage() {
  const { folders, error } = await getAdminNoteFolders();

  return (
    <AdminShell
      title="Notes"
      description="Manage Note folders now. Article editing comes in the next step."
    >
      <NoteFolderManager folders={folders} loadError={error} />
    </AdminShell>
  );
}
