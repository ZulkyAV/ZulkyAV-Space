import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow, StatusBadge } from "@/components/ui";
import { getPublicProjectDetail } from "@/lib/data/public-projects";

export const revalidate = 300;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ folderSlug: string; projectSlug: string }>;
}) {
  const { folderSlug, projectSlug } = await params;
  const result = await getPublicProjectDetail(folderSlug, projectSlug);

  if (!result) notFound();

  const { folder, project } = result;

  return (
    <article className="mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-24">
      <Link
        href={`/project/${folder.slug}`}
        className="text-sm font-semibold text-primary-300"
      >
        ← {folder.name}
      </Link>
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#1B1B23]">
          {project.image ? (
            <img
              src={project.image}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-500">
              No project image yet
            </div>
          )}
        </div>
        <div>
          <Eyebrow>Project brief</Eyebrow>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-50 sm:text-5xl">
            {project.title}
          </h1>
          <div className="mt-5">
            <StatusBadge status={project.status} />
          </div>
          <div className="mt-6 whitespace-pre-line text-lg leading-8 text-neutral-400">
            {project.description}
          </div>
          {project.downloadUrl ? (
            <a
              href={project.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-950/40 transition-colors hover:bg-primary-600"
            >
              {project.actionLabel || "Open project"} <span aria-hidden="true">↗</span>
            </a>
          ) : null}
          <div className="mt-10">
            <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              Ingredients &amp; components
            </p>
            {project.components.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {project.components.map((component) => (
                  <span
                    key={component}
                    className="rounded-full bg-[#1B1B23] px-3 py-1.5 text-sm text-neutral-300"
                  >
                    {component}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-400">
                No public ingredients or components listed yet.
              </p>
            )}
            <p className="mt-4 text-xs leading-5 text-neutral-500">
              Names only. Quantities and private recipe notes are not shown publicly.
            </p>
          </div>
        </div>
      </div>
      {project.galleryImages.length ? (
        <section className="mt-16 border-t border-white/10 pt-10">
          <Eyebrow>Project gallery</Eyebrow>
          <h2 className="text-2xl font-bold text-neutral-50">More from the build</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {project.galleryImages.map((image, index) => (
              <div
                key={`${index}-${image}`}
                className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[#1B1B23]"
              >
                <img
                  src={image}
                  alt={`${project.title} gallery photo ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <div className="mt-20 grid gap-12 border-t border-white/10 pt-10 md:grid-cols-[.7fr_1.3fr]">
        <div>
          <Eyebrow>Latest updates</Eyebrow>
          <h2 className="text-2xl font-bold text-neutral-50">The build log</h2>
        </div>
        {project.updates.length ? (
          <div className="space-y-5">
            {project.updates.map((update, index) => (
              <div
                key={`${index}-${update}`}
                className="flex gap-4 border-b border-white/10 pb-5"
              >
                <span className="font-mono text-xs text-primary-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-neutral-300">{update}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-400">No public updates yet.</p>
        )}
      </div>
    </article>
  );
}
