import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  AdminProjectFolder,
  ProjectFolderAccent,
  ProjectFolderStatus,
} from "@/types/project-admin";

type FolderRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  accent: ProjectFolderAccent;
  status: ProjectFolderStatus;
  sort_order: number;
};

type ProjectFolderRow = {
  folder_id: string | null;
};

export type AdminProjectFoldersResult = {
  folders: AdminProjectFolder[];
  error: string;
};

export async function getAdminProjectFolders(): Promise<AdminProjectFoldersResult> {
  const supabase = await createClient();
  const { data: isAdmin, error: adminError } = await supabase.rpc(
    "is_approved_admin",
  );

  if (adminError || isAdmin !== true) {
    return {
      folders: [],
      error: "Your verified admin session is no longer valid.",
    };
  }

  const { data: folderRows, error: folderError } = await supabase
    .from("folders")
    .select("id,slug,name,description,accent,status,sort_order")
    .eq("section", "project")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (folderError) {
    return {
      folders: [],
      error: "The project folders could not be loaded.",
    };
  }

  const { data: projectRows, error: projectError } = await supabase
    .from("projects")
    .select("folder_id")
    .not("folder_id", "is", null);

  if (projectError) {
    return {
      folders: [],
      error: "The project totals could not be loaded.",
    };
  }

  const counts = new Map<string, number>();

  for (const project of (projectRows ?? []) as ProjectFolderRow[]) {
    if (project.folder_id) {
      counts.set(project.folder_id, (counts.get(project.folder_id) ?? 0) + 1);
    }
  }

  return {
    error: "",
    folders: ((folderRows ?? []) as FolderRow[]).map((folder) => ({
      id: folder.id,
      slug: folder.slug,
      name: folder.name,
      description: folder.description,
      accent: folder.accent,
      status: folder.status,
      sortOrder: folder.sort_order,
      projectCount: counts.get(folder.id) ?? 0,
    })),
  };
}
