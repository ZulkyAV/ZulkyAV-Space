import { FolderCard, NoteCard } from "@/components/ui";
import { PageShell } from "@/components/page-shell";
import { getPublishedFolders, noteFolders, notes } from "@/data/mock-data";

export default function NotePage() { return <PageShell eyebrow="The notebook" title="Notes for later." description="Loose observations, small essays, and working thoughts from the middle of making things."><div className="grid gap-5 md:grid-cols-3">{getPublishedFolders(noteFolders).map((folder) => <FolderCard key={folder.slug} folder={folder} basePath="/note" />)}</div><div className="mt-20 max-w-3xl"><h2 className="mb-5 text-2xl font-bold text-neutral-950">Latest entries</h2>{notes.map((note) => <NoteCard key={note.slug} note={note} />)}</div></PageShell>; }
