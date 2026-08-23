import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui";
import { getPublicNoteArticle } from "@/lib/data/public-notes";

export const revalidate = 300;

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ folderSlug: string; noteSlug: string }>;
}) {
  const { folderSlug, noteSlug } = await params;
  const result = await getPublicNoteArticle(folderSlug, noteSlug);

  if (!result) notFound();

  const { folder, note } = result;

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
      <Link
        href={`/note/${folder.slug}`}
        className="text-sm font-semibold text-primary-700"
      >
        ← {folder.name}
      </Link>
      <header className="mt-12 border-b border-neutral-200 pb-10">
        <Eyebrow>
          {note.date} · {note.readTime}
        </Eyebrow>
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-950 sm:text-5xl">
          {note.title}
        </h1>
        <div className="mt-5 flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span key={tag} className="font-mono text-xs text-primary-600">
              #{tag}
            </span>
          ))}
        </div>
      </header>
      <div className="prose prose-slate mt-10 max-w-none">
        {note.content.map((paragraph, index) => (
          <p
            key={`${index}-${paragraph.slice(0, 24)}`}
            className="mb-6 whitespace-pre-wrap text-lg leading-8 text-neutral-700"
          >
            {paragraph}
          </p>
        ))}
      </div>
      <div className="mt-16 border-t border-neutral-200 pt-8">
        <Link href="/note" className="text-sm font-semibold text-primary-700">
          Browse all notes →
        </Link>
      </div>
    </article>
  );
}
