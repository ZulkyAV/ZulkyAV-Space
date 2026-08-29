"use server";

import { revalidatePath } from "next/cache";
import { destroyManagedImage } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";
import {
  projectFolderAccents,
  projectFolderStatuses,
  type ProjectFolderAccent,
  type ProjectFolderStatus,
} from "@/types/project-admin";

export type ProjectFolderFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

type ParsedFolder = {
  name: string;
  slug: string;
  description: string;
  accent: ProjectFolderAccent;
  status: ProjectFolderStatus;
  sortOrder: number;
};

function readText(formData: FormData, key: string, maxLength: number) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function parseFolder(formData: FormData): ParsedFolder | ProjectFolderFormState {
  const name = readText(formData, "name", 100);
  const slug = readText(formData, "slug", 100).toLowerCase();
  const description = readText(formData, "description", 500);
  const accentValue = readText(formData, "accent", 20);
  const statusValue = readText(formData, "status", 20);
  const sortOrderValue = Number(readText(formData, "sortOrder", 6));

  if (!name || !slug) {
    return {
      status: "error",
      message: "Folder name and slug are required.",
    };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      status: "error",
      message: "Slug may only contain lowercase letters, numbers, and hyphens.",
    };
  }

  if (!projectFolderAccents.includes(accentValue as ProjectFolderAccent)) {
    return { status: "error", message: "The selected accent is invalid." };
  }

  if (!projectFolderStatuses.includes(statusValue as ProjectFolderStatus)) {
    return { status: "error", message: "The selected status is invalid." };
  }

  if (
    !Number.isInteger(sortOrderValue) ||
    sortOrderValue < 0 ||
    sortOrderValue > 9999
  ) {
    return {
      status: "error",
      message: "Sort order must be a whole number from 0 to 9999.",
    };
  }

  return {
    name,
    slug,
    description,
    accent: accentValue as ProjectFolderAccent,
    status: statusValue as ProjectFolderStatus,
    sortOrder: sortOrderValue,
  };
}

async function getApprovedAdminClient() {
  const supabase = await createClient();
  const { data: isAdmin, error } = await supabase.rpc("is_approved_admin");

  if (error || isAdmin !== true) {
    return null;
  }

  return supabase;
}

function mutationError(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "That slug is already used by another Project folder.";
  }

  return "The folder could not be saved. Please try again.";
}

function refreshProjectPaths() {
  revalidatePath("/admin/project");
  revalidatePath("/project");
}

export async function createProjectFolder(
  _previousState: ProjectFolderFormState,
  formData: FormData,
): Promise<ProjectFolderFormState> {
  const parsed = parseFolder(formData);

  if ("message" in parsed) {
    return parsed;
  }

  const supabase = await getApprovedAdminClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Your verified admin session is no longer valid.",
    };
  }

  const { error } = await supabase.from("folders").insert({
    section: "project",
    name: parsed.name,
    slug: parsed.slug,
    description: parsed.description,
    accent: parsed.accent,
    status: parsed.status,
    sort_order: parsed.sortOrder,
  });

  if (error) {
    return { status: "error", message: mutationError(error) };
  }

  refreshProjectPaths();

  return { status: "success", message: "Project folder created." };
}

export async function updateProjectFolder(
  _previousState: ProjectFolderFormState,
  formData: FormData,
): Promise<ProjectFolderFormState> {
  const id = readText(formData, "id", 36);
  const parsed = parseFolder(formData);

  if (!isUuid(id)) {
    return { status: "error", message: "The folder ID is invalid." };
  }

  if ("message" in parsed) {
    return parsed;
  }

  const supabase = await getApprovedAdminClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Your verified admin session is no longer valid.",
    };
  }

  const { data, error } = await supabase
    .from("folders")
    .update({
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      accent: parsed.accent,
      status: parsed.status,
      sort_order: parsed.sortOrder,
    })
    .eq("id", id)
    .eq("section", "project")
    .select("id")
    .maybeSingle();

  if (error) {
    return { status: "error", message: mutationError(error) };
  }

  if (!data) {
    return { status: "error", message: "The Project folder was not found." };
  }

  refreshProjectPaths();

  return { status: "success", message: "Project folder saved." };
}

export async function archiveProjectFolder(
  _previousState: ProjectFolderFormState,
  formData: FormData,
): Promise<ProjectFolderFormState> {
  const id = readText(formData, "id", 36);

  if (!isUuid(id)) {
    return { status: "error", message: "The folder ID is invalid." };
  }

  const supabase = await getApprovedAdminClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Your verified admin session is no longer valid.",
    };
  }

  const { data, error } = await supabase
    .from("folders")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("section", "project")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message: "The Project folder could not be archived.",
    };
  }

  refreshProjectPaths();

  return { status: "success", message: "Project folder archived." };
}

export async function deleteProjectFolder(
  _previousState: ProjectFolderFormState,
  formData: FormData,
): Promise<ProjectFolderFormState> {
  const id = readText(formData, "id", 36);
  if (!isUuid(id)) return { status: "error", message: "The folder ID is invalid." };

  const supabase = await getApprovedAdminClient();
  if (!supabase) {
    return { status: "error", message: "Your verified admin session is no longer valid." };
  }

  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("id")
    .eq("id", id)
    .eq("section", "project")
    .maybeSingle();
  if (folderError || !folder) {
    return { status: "error", message: "The Project folder was not found." };
  }

  const projectsResult = await supabase
    .from("projects")
    .select("id,image_public_id")
    .eq("folder_id", id);
  if (projectsResult.error) {
    return { status: "error", message: "Projects could not be loaded for deletion." };
  }

  const projectIds = (projectsResult.data ?? []).map((project) => project.id);
  const galleryResult = projectIds.length
    ? await supabase.from("project_images").select("image_public_id").in("project_id", projectIds)
    : { data: [], error: null };
  if (galleryResult.error) {
    return { status: "error", message: "Project gallery files could not be loaded." };
  }

  const { data, error } = await supabase
    .from("folders")
    .delete()
    .eq("id", id)
    .eq("section", "project")
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { status: "error", message: "The Project folder could not be deleted." };
  }

  await Promise.all([
    ...(projectsResult.data ?? []).map((project) =>
      destroyManagedImage(project.image_public_id, "project"),
    ),
    ...(galleryResult.data ?? []).map((image) =>
      destroyManagedImage(image.image_public_id, "project"),
    ),
  ]);

  refreshProjectPaths();
  return { status: "success", message: "Project folder, projects, and files permanently deleted." };
}
