import "server-only";

import type { Folder, FolderStatus, Project } from "@/types/content";
import { createPublicClient } from "@/lib/supabase/public";

type FolderRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  accent: string;
  status: FolderStatus;
  sort_order: number;
};

type ProjectRow = {
  id: string;
  folder_id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  download_url: string | null;
  action_label: string;
  stage: string;
  sort_order: number;
};

type ComponentRow = {
  name: string;
};

type UpdateRow = {
  title: string;
  content: string;
};

type ProjectImageRow = {
  image_url: string;
};

export type PublicProjectIndexResult = {
  folders: Folder[];
  projects: Project[];
  error: string;
};

export type PublicProjectFolderResult = {
  folder: Folder;
  projects: Project[];
};

export type PublicProjectDetailResult = {
  folder: Folder;
  project: Project;
};

const folderSelect = "id,slug,name,description,accent,status,sort_order";
const projectSelect =
  "id,folder_id,slug,title,description,image_url,download_url,action_label,stage,sort_order";

function stageLabel(stage: string) {
  return stage
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapFolder(
  row: FolderRow,
  count: number,
  featured?: ProjectRow,
): Folder {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    accent: row.accent,
    status: row.status,
    count,
    coverImage: featured?.image_url ?? undefined,
    coverLabel: featured?.title,
  };
}

function mapProject(
  row: ProjectRow,
  folderSlug: string,
  components: string[] = [],
  updates: string[] = [],
  galleryImages: string[] = [],
): Project {
  return {
    slug: row.slug,
    folderSlug,
    title: row.title,
    description: row.description,
    status: stageLabel(row.stage),
    image: row.image_url ?? "",
    galleryImages,
    downloadUrl: row.download_url ?? undefined,
    actionLabel: row.action_label || "Download APK",
    components,
    updates,
  };
}

export async function getPublicProjectIndex(): Promise<PublicProjectIndexResult> {
  try {
    const supabase = createPublicClient();
    const { data: folderData, error: folderError } = await supabase
      .from("folders")
      .select(folderSelect)
      .eq("section", "project")
      .in("status", ["published", "maintenance"])
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (folderError) throw folderError;

    const folderRows = (folderData ?? []) as FolderRow[];
    const publishedFolders = folderRows.filter(
      (folder) => folder.status === "published",
    );
    const publishedIds = publishedFolders.map((folder) => folder.id);
    const folderSlugById = new Map(
      publishedFolders.map((folder) => [folder.id, folder.slug]),
    );
    let projectRows: ProjectRow[] = [];

    if (publishedIds.length) {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(projectSelect)
        .eq("is_published", true)
        .in("folder_id", publishedIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (projectError) throw projectError;
      projectRows = (projectData ?? []) as ProjectRow[];
    }

    const counts = new Map<string, number>();
    const featuredByFolder = new Map<string, ProjectRow>();
    projectRows.forEach((project) => {
      counts.set(
        project.folder_id,
        (counts.get(project.folder_id) ?? 0) + 1,
      );
      if (project.image_url && !featuredByFolder.has(project.folder_id)) {
        featuredByFolder.set(project.folder_id, project);
      }
    });

    return {
      error: "",
      folders: folderRows.map((folder) =>
        mapFolder(
          folder,
          counts.get(folder.id) ?? 0,
          featuredByFolder.get(folder.id),
        ),
      ),
      projects: projectRows.flatMap((project) => {
        const folderSlug = folderSlugById.get(project.folder_id);
        return folderSlug ? [mapProject(project, folderSlug)] : [];
      }),
    };
  } catch {
    return {
      folders: [],
      projects: [],
      error: "Project data is temporarily unavailable.",
    };
  }
}

export async function getPublicProjectFolder(
  folderSlug: string,
): Promise<PublicProjectFolderResult | null> {
  try {
    const supabase = createPublicClient();
    const { data: folderData, error: folderError } = await supabase
      .from("folders")
      .select(folderSelect)
      .eq("section", "project")
      .eq("slug", folderSlug)
      .eq("status", "published")
      .maybeSingle();

    if (folderError) throw folderError;
    if (!folderData) return null;

    const folderRow = folderData as FolderRow;
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select(projectSelect)
      .eq("folder_id", folderRow.id)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (projectError) throw projectError;

    const projects = ((projectData ?? []) as ProjectRow[]).map((project) =>
      mapProject(project, folderRow.slug),
    );

    return {
      folder: mapFolder(folderRow, projects.length),
      projects,
    };
  } catch {
    return null;
  }
}

export async function getPublicProjectDetail(
  folderSlug: string,
  projectSlug: string,
): Promise<PublicProjectDetailResult | null> {
  try {
    const supabase = createPublicClient();
    const { data: folderData, error: folderError } = await supabase
      .from("folders")
      .select(folderSelect)
      .eq("section", "project")
      .eq("slug", folderSlug)
      .eq("status", "published")
      .maybeSingle();

    if (folderError) throw folderError;
    if (!folderData) return null;

    const folderRow = folderData as FolderRow;
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select(projectSelect)
      .eq("folder_id", folderRow.id)
      .eq("slug", projectSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (projectError) throw projectError;
    if (!projectData) return null;

    const projectRow = projectData as ProjectRow;
    const [componentResult, updateResult, galleryResult] = await Promise.all([
      supabase
        .from("project_components")
        .select("name")
        .eq("project_id", projectRow.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("project_updates")
        .select("title,content")
        .eq("project_id", projectRow.id)
        .eq("is_published", true)
        .order("update_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("project_images")
        .select("image_url")
        .eq("project_id", projectRow.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    if (componentResult.error) throw componentResult.error;
    if (updateResult.error) throw updateResult.error;
    if (galleryResult.error) throw galleryResult.error;

    const components = ((componentResult.data ?? []) as ComponentRow[]).map(
      (component) => component.name,
    );
    const updates = ((updateResult.data ?? []) as UpdateRow[]).map((update) =>
      [update.title, update.content].filter(Boolean).join(" — "),
    );
    const galleryImages = ((galleryResult.data ?? []) as ProjectImageRow[]).map(
      (image) => image.image_url,
    );

    return {
      folder: mapFolder(folderRow, 0),
      project: mapProject(projectRow, folderRow.slug, components, updates, galleryImages),
    };
  } catch {
    return null;
  }
}
