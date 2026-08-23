import { FolderCard, NoteCard } from "@/components/ui";
import { PageShell } from "@/components/page-shell";
import { getPublicNoteIndex } from "@/lib/data/public-notes";

export const revalidate = 300;

export default async function NotePage() {
  const { folders, notes } = await getPublicNoteIndex();

  return (
    <PageShell
      eyebrow="The notebook"
      title="Notes for later."
      description="Loose observations, small essays, and working thoughts from the middle of making things."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {folders.length ? (
          folders.map((folder) => (
            <FolderCard key={folder.slug} folder={folder} basePath="/note" />
          ))
        ) : (
          <p className="text-neutral-500">No public Note folders yet.</p>
        )}
      </div>

      <div className="mt-20 max-w-3xl">
        <h2 className="mb-5 text-2xl font-bold text-neutral-950">
          Latest entries
        </h2>
        {notes.length ? (
          notes.map((note) => <NoteCard key={`${note.folderSlug}/${note.slug}`} note={note} />)
        ) : (
          <p className="text-neutral-500">No public notes yet.</p>
        )}
      </div>
    </PageShell>
  );
}
