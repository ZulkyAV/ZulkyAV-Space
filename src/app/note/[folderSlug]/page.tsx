import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteCard, StatusBadge } from "@/components/ui";
import { getPublicNoteFolder } from "@/lib/data/public-notes";

export const revalidate = 300;

export default async function NoteFolderPage({
  params,
}: {
  params: Promise<{ folderSlug: string }>;
}) {
  const { folderSlug } = await params;
  const result = await getPublicNoteFolder(folderSlug);

  if (!result || result.folder.status !== "published") notFound();

  const { folder, notes } = result;

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8 lg:py-24">
      <Link href="/note" className="text-sm font-semibold text-primary-300">
        ← All notes
      </Link>
      <div className="mt-12 border-b border-white/10 pb-10">
        <div className="flex items-center gap-3">
          <StatusBadge status={folder.status} />
          <span className="font-mono text-xs text-neutral-500">
            {folder.count} entries
          </span>
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-neutral-50 sm:text-5xl">
          {folder.name}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-400">
          {folder.description}
        </p>
      </div>
      <div className="mt-10">
        {notes.length ? (
          notes.map((note) => <NoteCard key={note.slug} note={note} />)
        ) : (
          <p className="text-neutral-400">No public notes here yet.</p>
        )}
      </div>
    </div>
  );
}
