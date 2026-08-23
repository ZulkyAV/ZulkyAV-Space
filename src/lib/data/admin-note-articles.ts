import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AdminNoteArticle } from "@/types/note-article-admin";

type NoteRow = {
  id: string;
  folder_id: string | null;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[] | null;
  read_time: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AdminNoteArticlesResult = {
  articles: AdminNoteArticle[];
  error: string;
};

export async function getAdminNoteArticles(): Promise<AdminNoteArticlesResult> {
  const supabase = await createClient();
  const { data: isAdmin, error: adminError } = await supabase.rpc(
    "is_approved_admin",
  );

  if (adminError || isAdmin !== true) {
    return {
      articles: [],
      error: "Your verified admin session is no longer valid.",
    };
  }

  const { data, error } = await supabase
    .from("notes")
    .select(
      "id,folder_id,slug,title,content,excerpt,tags,read_time,published,sort_order,created_at,updated_at",
    )
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) {
    return {
      articles: [],
      error: "The Note articles could not be loaded.",
    };
  }

  return {
    error: "",
    articles: ((data ?? []) as NoteRow[]).map((article) => ({
      id: article.id,
      folderId: article.folder_id,
      slug: article.slug,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      tags: article.tags ?? [],
      readTime: article.read_time,
      published: article.published,
      sortOrder: article.sort_order,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
    })),
  };
}
