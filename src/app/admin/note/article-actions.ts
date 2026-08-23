"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NoteArticleFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

type ParsedArticle = {
  folderId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  readTime: string;
  published: boolean;
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

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 10);
}

function parseArticle(formData: FormData): ParsedArticle | NoteArticleFormState {
  const folderId = readText(formData, "folderId", 36);
  const title = readText(formData, "title", 160);
  const slug = readText(formData, "slug", 140).toLowerCase();
  const excerpt = readText(formData, "excerpt", 500);
  const content = readText(formData, "content", 50000);
  const tags = parseTags(readText(formData, "tags", 500));
  const readTime = readText(formData, "readTime", 50);
  const published = readText(formData, "publication", 20) === "published";
  const sortOrder = Number(readText(formData, "sortOrder", 6));

  if (!isUuid(folderId)) {
    return { status: "error", message: "Choose a valid Note folder." };
  }

  if (!title || !slug || !excerpt || !content) {
    return {
      status: "error",
      message: "Title, slug, excerpt, and article content are required.",
    };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      status: "error",
      message: "Slug may only contain lowercase letters, numbers, and hyphens.",
    };
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    return {
      status: "error",
      message: "Sort order must be a whole number from 0 to 9999.",
    };
  }

  return {
    folderId,
    title,
    slug,
    excerpt,
    content,
    tags,
    readTime,
    published,
    sortOrder,
  };
}

async function getApprovedAdminClient() {
  const supabase = await createClient();
  const { data: isAdmin, error } = await supabase.rpc("is_approved_admin");
  return error || isAdmin !== true ? null : supabase;
}

async function validateFolder(
  supabase: NonNullable<Awaited<ReturnType<typeof getApprovedAdminClient>>>,
  folderId: string,
  publishing: boolean,
) {
  const { data, error } = await supabase
    .from("folders")
    .select("id,status")
    .eq("id", folderId)
    .eq("section", "note")
    .maybeSingle();

  if (error || !data) return "The selected Note folder was not found.";

  if (publishing && data.status !== "published") {
    return "Publish the folder first before publishing an article inside it.";
  }

  return "";
}

function mutationError(error: { code?: string; message: string }) {
  if (error.code === "23505") return "That article slug is already in use.";
  return "The article could not be saved. Please try again.";
}

function refreshNotePaths() {
  revalidatePath("/admin/note");
  revalidatePath("/note");
}

export async function createNoteArticle(
  _previousState: NoteArticleFormState,
  formData: FormData,
): Promise<NoteArticleFormState> {
  const parsed = parseArticle(formData);
  if ("message" in parsed) return parsed;

  const supabase = await getApprovedAdminClient();
  if (!supabase) {
    return { status: "error", message: "Your verified admin session is no longer valid." };
  }

  const folderError = await validateFolder(supabase, parsed.folderId, parsed.published);
  if (folderError) return { status: "error", message: folderError };

  const { error } = await supabase.from("notes").insert({
    folder_id: parsed.folderId,
    title: parsed.title,
    slug: parsed.slug,
    excerpt: parsed.excerpt,
    content: parsed.content,
    tags: parsed.tags,
    read_time: parsed.readTime,
    published: parsed.published,
    sort_order: parsed.sortOrder,
  });

  if (error) return { status: "error", message: mutationError(error) };

  refreshNotePaths();
  return { status: "success", message: "Note article created." };
}

export async function updateNoteArticle(
  _previousState: NoteArticleFormState,
  formData: FormData,
): Promise<NoteArticleFormState> {
  const id = readText(formData, "id", 36);
  const parsed = parseArticle(formData);

  if (!isUuid(id)) return { status: "error", message: "The article ID is invalid." };
  if ("message" in parsed) return parsed;

  const supabase = await getApprovedAdminClient();
  if (!supabase) {
    return { status: "error", message: "Your verified admin session is no longer valid." };
  }

  const folderError = await validateFolder(supabase, parsed.folderId, parsed.published);
  if (folderError) return { status: "error", message: folderError };

  const { data: current, error: currentError } = await supabase
    .from("notes")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (currentError || !current) {
    return { status: "error", message: "The Note article was not found." };
  }

  const { error } = await supabase
    .from("notes")
    .update({
      folder_id: parsed.folderId,
      title: parsed.title,
      slug: parsed.slug,
      excerpt: parsed.excerpt,
      content: parsed.content,
      tags: parsed.tags,
      read_time: parsed.readTime,
      published: parsed.published,
      sort_order: parsed.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { status: "error", message: mutationError(error) };

  refreshNotePaths();
  return { status: "success", message: "Note article saved." };
}
