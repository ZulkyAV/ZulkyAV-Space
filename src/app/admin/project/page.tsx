import { AdminShell } from "@/components/admin-shell";
import { ProjectFolderManager } from "@/app/admin/project/folder-manager";
import { getAdminProjectFolders } from "@/lib/data/admin-projects";

export const dynamic = "force-dynamic";

export default async function AdminProjectPage() {
  const { folders, error } = await getAdminProjectFolders();

  return (
    <AdminShell
      title="Projects"
      description="Manage Project folders now. Project content comes in the next step."
    >
      <ProjectFolderManager folders={folders} loadError={error} />
    </AdminShell>
  );
}
