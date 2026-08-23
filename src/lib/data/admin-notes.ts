import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  AdminNoteFolder,
  NoteFolderAccent,
  NoteFolderStatus,
} from "@/types/note-admin";

type FolderRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  accent: NoteFolderAccent;
  status: NoteFolderStatus;
  sort_order: number;
};

type NoteFolderRow = {
  folder_id: string | null;
};

export type AdminNoteFoldersResult = {
  folders: AdminNoteFolder[];
  error: string;
};

export async function getAdminNoteFolders(): Promise<AdminNoteFoldersResult> {
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
    .eq("section", "note")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (folderError) {
    return {
      folders: [],
      error: "The note folders could not be loaded.",
    };
  }

  const { data: noteRows, error: noteError } = await supabase
    .from("notes")
    .select("folder_id")
    .not("folder_id", "is", null);

  if (noteError) {
    return {
      folders: [],
      error: "The article totals could not be loaded.",
    };
  }

  const counts = new Map<string, number>();

  for (const note of (noteRows ?? []) as NoteFolderRow[]) {
    if (note.folder_id) {
      counts.set(note.folder_id, (counts.get(note.folder_id) ?? 0) + 1);
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
      noteCount: counts.get(folder.id) ?? 0,
    })),
  };
}
