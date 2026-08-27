import "server-only";

import { getApprovedAdminClient } from "@/lib/admin-session";
import type {
  AdminProjectContent,
  AdminProjectFolderOption,
} from "@/types/project-content-admin";

type ProjectRow = {
  id: string;
  folder_id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  image_public_id: string | null;
  download_url: string | null;
  action_label: string;
  project_type: AdminProjectContent["projectType"];
  stage: AdminProjectContent["stage"];
  is_published: boolean;
  sort_order: number;
};

type ProjectImageRow = {
  project_id: string;
  image_url: string;
  image_public_id: string | null;
  sort_order: number;
};

export async function getAdminProjectContent(): Promise<{
  folders: AdminProjectFolderOption[];
  projects: AdminProjectContent[];
  error: string;
}> {
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { folders: [], projects: [], error: "Admin session expired." };

  const [folderResult, projectResult] = await Promise.all([
    supabase
      .from("folders")
      .select("id,name,status,sort_order")
      .eq("section", "project")
      .neq("status", "archived")
      .order("sort_order"),
    supabase
      .from("projects")
      .select("id,folder_id,slug,title,description,image_url,image_public_id,download_url,action_label,project_type,stage,is_published,sort_order")
      .order("sort_order")
      .order("created_at", { ascending: false }),
  ]);

  if (folderResult.error || projectResult.error) {
    return { folders: [], projects: [], error: "Project content could not be loaded." };
  }

  const projectRows = (projectResult.data ?? []) as ProjectRow[];
  const projectIds = projectRows.map((project) => project.id);
  let components: Array<Record<string, unknown>> = [];
  let privateComponents: Array<Record<string, unknown>> = [];
  let updates: Array<Record<string, unknown>> = [];
  let galleryImages: ProjectImageRow[] = [];

  if (projectIds.length) {
    const [componentResult, updateResult, galleryResult] = await Promise.all([
      supabase
        .from("project_components")
        .select("id,project_id,name,kind,sort_order")
        .in("project_id", projectIds)
        .order("sort_order"),
      supabase
        .from("project_updates")
        .select("project_id,title,content,update_date,is_published,created_at")
        .in("project_id", projectIds)
        .order("update_date", { ascending: false }),
      supabase
        .from("project_images")
        .select("project_id,image_url,image_public_id,sort_order")
        .in("project_id", projectIds)
        .order("sort_order"),
    ]);
    if (componentResult.error || updateResult.error || galleryResult.error) {
      return { folders: [], projects: [], error: "Project details could not be loaded." };
    }
    components = componentResult.data ?? [];
    updates = updateResult.data ?? [];
    galleryImages = (galleryResult.data ?? []) as ProjectImageRow[];

    const componentIds = components.map((component) => String(component.id));
    if (componentIds.length) {
      const privateResult = await supabase
        .from("project_component_private")
        .select("component_id,quantity,unit,private_notes")
        .in("component_id", componentIds);
      if (privateResult.error) {
        return { folders: [], projects: [], error: "Private component data could not be loaded." };
      }
      privateComponents = privateResult.data ?? [];
    }
  }

  const privateById = new Map(
    privateComponents.map((entry) => [String(entry.component_id), entry]),
  );

  return {
    error: "",
    folders: (folderResult.data ?? []).map((folder) => ({
      id: String(folder.id),
      name: String(folder.name),
      status: String(folder.status),
    })),
    projects: projectRows.map((project) => ({
      id: project.id,
      folderId: project.folder_id,
      slug: project.slug,
      title: project.title,
      description: project.description,
      imageUrl: project.image_url ?? "",
      imagePublicId: project.image_public_id ?? "",
      downloadUrl: project.download_url ?? "",
      actionLabel: project.action_label || "Download APK",
      galleryImages: galleryImages
        .filter((image) => image.project_id === project.id)
        .map((image) => ({
          imageUrl: image.image_url,
          imagePublicId: image.image_public_id ?? "",
        })),
      projectType: project.project_type,
      stage: project.stage,
      isPublished: project.is_published,
      sortOrder: project.sort_order,
      componentsText: components
        .filter((component) => component.project_id === project.id)
        .map((component) => {
          const privateEntry = privateById.get(String(component.id));
          return [
            component.name,
            component.kind,
            privateEntry?.quantity ?? "",
            privateEntry?.unit ?? "",
            privateEntry?.private_notes ?? "",
          ].join(" | ");
        })
        .join("\n"),
      updatesText: updates
        .filter((update) => update.project_id === project.id)
        .map((update) =>
          [
            update.update_date,
            update.is_published ? "public" : "private",
            update.title,
            update.content,
          ].join(" | "),
        )
        .join("\n"),
    })),
  };
}
