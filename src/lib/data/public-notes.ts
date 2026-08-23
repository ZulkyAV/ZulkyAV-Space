import "server-only";

import {
  getPublicFolders,
  noteFolders as mockFolders,
  notes as mockNotes,
  type Folder,
  type FolderStatus,
  type Note,
} from "@/data/mock-data";
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

type NoteRow = {
  id: string;
  folder_id: string | null;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[] | null;
  read_time: string;
  created_at: string;
};

export type PublicNoteFolderResult = {
  folder: Folder;
  notes: Note[];
};

export type PublicNoteArticleResult = {
  folder: Folder;
  note: Note;
};

const folderSelect =
  "id,slug,name,description,accent,status,sort_order";
const noteSelect =
  "id,folder_id,slug,title,content,excerpt,tags,read_time,created_at";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function splitContent(value: string) {
  const paragraphs = value
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.length ? paragraphs : [value];
}

function mapNote(row: NoteRow, folderSlug: string): Note {
  return {
    slug: row.slug,
    folderSlug,
    title: row.title,
    excerpt: row.excerpt,
    date: formatDate(row.created_at),
    readTime: row.read_time || "Short read",
    tags: row.tags ?? [],
    content: splitContent(row.content),
  };
}

function mapFolder(row: FolderRow, count: number): Folder {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    accent: row.accent,
    status: row.status,
    count,
  };
}

function getMockIndex() {
  const folders = getPublicFolders(mockFolders);
  const visibleFolderSlugs = new Set(
    folders
      .filter((folder) => folder.status === "published")
      .map((folder) => folder.slug),
  );

  return {
    folders,
    notes: mockNotes.filter((note) => visibleFolderSlugs.has(note.folderSlug)),
  };
}

export async function getPublicNoteIndex(): Promise<{
  folders: Folder[];
  notes: Note[];
}> {
  try {
    const supabase = createPublicClient();
    const { data: folderData, error: folderError } = await supabase
      .from("folders")
      .select(folderSelect)
      .eq("section", "note")
      .in("status", ["published", "maintenance"])
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (folderError) throw folderError;

    const folderRows = (folderData ?? []) as FolderRow[];
    const publishedFolderRows = folderRows.filter(
      (folder) => folder.status === "published",
    );
    const publishedFolderIds = publishedFolderRows.map((folder) => folder.id);
    const folderSlugById = new Map(
      publishedFolderRows.map((folder) => [folder.id, folder.slug]),
    );
    let noteRows: NoteRow[] = [];

    if (publishedFolderIds.length) {
      const { data: noteData, error: noteError } = await supabase
        .from("notes")
        .select(noteSelect)
        .eq("published", true)
        .in("folder_id", publishedFolderIds)
        .order("created_at", { ascending: false });

      if (noteError) throw noteError;
      noteRows = (noteData ?? []) as NoteRow[];
    }

    const counts = new Map<string, number>();
    noteRows.forEach((note) => {
      if (!note.folder_id) return;
      counts.set(note.folder_id, (counts.get(note.folder_id) ?? 0) + 1);
    });

    return {
      folders: folderRows.map((folder) =>
        mapFolder(folder, counts.get(folder.id) ?? 0),
      ),
      notes: noteRows.flatMap((note) => {
        if (!note.folder_id) return [];
        const folderSlug = folderSlugById.get(note.folder_id);
        return folderSlug ? [mapNote(note, folderSlug)] : [];
      }),
    };
  } catch {
    return getMockIndex();
  }
}

export async function getPublicNoteFolder(
  folderSlug: string,
): Promise<PublicNoteFolderResult | null> {
  try {
    const supabase = createPublicClient();
    const { data: folderData, error: folderError } = await supabase
      .from("folders")
      .select(folderSelect)
      .eq("section", "note")
      .eq("slug", folderSlug)
      .in("status", ["published", "maintenance"])
      .maybeSingle();

    if (folderError) throw folderError;
    if (!folderData) return null;

    const folderRow = folderData as FolderRow;
    if (folderRow.status !== "published") {
      return { folder: mapFolder(folderRow, 0), notes: [] };
    }

    const { data: noteData, error: noteError } = await supabase
      .from("notes")
      .select(noteSelect)
      .eq("folder_id", folderRow.id)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (noteError) throw noteError;

    const notes = ((noteData ?? []) as NoteRow[]).map((note) =>
      mapNote(note, folderRow.slug),
    );

    return {
      folder: mapFolder(folderRow, notes.length),
      notes,
    };
  } catch {
    const folder = mockFolders.find((entry) => entry.slug === folderSlug);
    if (!folder || !["published", "maintenance"].includes(folder.status)) {
      return null;
    }

    const notes =
      folder.status === "published"
        ? mockNotes.filter((note) => note.folderSlug === folder.slug)
        : [];

    return {
      folder: { ...folder, count: notes.length },
      notes,
    };
  }
}

export async function getPublicNoteArticle(
  folderSlug: string,
  noteSlug: string,
): Promise<PublicNoteArticleResult | null> {
  try {
    const supabase = createPublicClient();
    const { data: folderData, error: folderError } = await supabase
      .from("folders")
      .select(folderSelect)
      .eq("section", "note")
      .eq("slug", folderSlug)
      .eq("status", "published")
      .maybeSingle();

    if (folderError) throw folderError;
    if (!folderData) return null;

    const folderRow = folderData as FolderRow;
    const { data: noteData, error: noteError } = await supabase
      .from("notes")
      .select(noteSelect)
      .eq("folder_id", folderRow.id)
      .eq("slug", noteSlug)
      .eq("published", true)
      .maybeSingle();

    if (noteError) throw noteError;
    if (!noteData) return null;

    return {
      folder: mapFolder(folderRow, 0),
      note: mapNote(noteData as NoteRow, folderRow.slug),
    };
  } catch {
    const folder = mockFolders.find(
      (entry) => entry.slug === folderSlug && entry.status === "published",
    );
    const note = mockNotes.find(
      (entry) =>
        entry.folderSlug === folderSlug && entry.slug === noteSlug,
    );

    return folder && note ? { folder, note } : null;
  }
}
