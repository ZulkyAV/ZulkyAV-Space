import { AdminShell } from "@/components/admin-shell";
import { ProjectFolderManager } from "@/app/admin/project/folder-manager";
import { getAdminProjectFolders } from "@/lib/data/admin-projects";
import { ProjectContentManager } from "@/app/admin/project/content-manager";
import { getAdminProjectContent } from "@/lib/data/admin-project-content";

export const dynamic = "force-dynamic";

export default async function AdminProjectPage() {
  const [{ folders, error }, content] = await Promise.all([
    getAdminProjectFolders(),
    getAdminProjectContent(),
  ]);

  return (
    <AdminShell
      title="Projects"
      description="Manage folders, projects, public components, private quantities, images, and progress updates."
    >
      <div className="space-y-14">
        <ProjectFolderManager folders={folders} loadError={error} />
        <ProjectContentManager
          folders={content.folders}
          projects={content.projects}
          loadError={content.error}
        />
      </div>
    </AdminShell>
  );
}
