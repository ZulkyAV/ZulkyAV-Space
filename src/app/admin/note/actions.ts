"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  noteFolderAccents,
  noteFolderStatuses,
  type NoteFolderAccent,
  type NoteFolderStatus,
} from "@/types/note-admin";

export type NoteFolderFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

type ParsedFolder = {
  name: string;
  slug: string;
  description: string;
  accent: NoteFolderAccent;
  status: NoteFolderStatus;
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

function parseFolder(formData: FormData): ParsedFolder | NoteFolderFormState {
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

  if (!noteFolderAccents.includes(accentValue as NoteFolderAccent)) {
    return { status: "error", message: "The selected accent is invalid." };
  }

  if (!noteFolderStatuses.includes(statusValue as NoteFolderStatus)) {
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
    accent: accentValue as NoteFolderAccent,
    status: statusValue as NoteFolderStatus,
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
    return "That slug is already used by another Note folder.";
  }

  return "The folder could not be saved. Please try again.";
}

function refreshNotePaths() {
  revalidatePath("/admin/note");
  revalidatePath("/note");
}

export async function createNoteFolder(
  _previousState: NoteFolderFormState,
  formData: FormData,
): Promise<NoteFolderFormState> {
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
    section: "note",
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

  refreshNotePaths();

  return { status: "success", message: "Note folder created." };
}

export async function updateNoteFolder(
  _previousState: NoteFolderFormState,
  formData: FormData,
): Promise<NoteFolderFormState> {
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
    .eq("section", "note")
    .select("id")
    .maybeSingle();

  if (error) {
    return { status: "error", message: mutationError(error) };
  }

  if (!data) {
    return { status: "error", message: "The Note folder was not found." };
  }

  refreshNotePaths();

  return { status: "success", message: "Note folder saved." };
}

export async function archiveNoteFolder(
  _previousState: NoteFolderFormState,
  formData: FormData,
): Promise<NoteFolderFormState> {
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
    .eq("section", "note")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message: "The Note folder could not be archived.",
    };
  }

  refreshNotePaths();

  return { status: "success", message: "Note folder archived." };
}

export async function deleteNoteFolder(
  _previousState: NoteFolderFormState,
  formData: FormData,
): Promise<NoteFolderFormState> {
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
    .eq("section", "note")
    .maybeSingle();
  if (folderError || !folder) {
    return { status: "error", message: "The Note folder was not found." };
  }

  const articlesResult = await supabase.from("notes").delete().eq("folder_id", id);
  if (articlesResult.error) {
    return { status: "error", message: "The folder's articles could not be deleted." };
  }

  const { data, error } = await supabase
    .from("folders")
    .delete()
    .eq("id", id)
    .eq("section", "note")
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { status: "error", message: "The Note folder could not be deleted." };
  }

  refreshNotePaths();
  return { status: "success", message: "Note folder and its articles permanently deleted." };
}
