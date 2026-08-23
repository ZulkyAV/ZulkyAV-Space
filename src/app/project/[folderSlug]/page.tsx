import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectCard, StatusBadge } from "@/components/ui";
import { getPublicProjectFolder } from "@/lib/data/public-projects";

export const revalidate = 300;

export default async function ProjectFolderPage({
  params,
}: {
  params: Promise<{ folderSlug: string }>;
}) {
  const { folderSlug } = await params;
  const result = await getPublicProjectFolder(folderSlug);

  if (!result) notFound();

  const { folder, projects } = result;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
      <Link href="/project" className="text-sm font-semibold text-primary-300">
        ← All projects
      </Link>
      <div className="mt-12 border-b border-white/10 pb-10">
        <div className="flex items-center gap-3">
          <StatusBadge status={folder.status} />
          <span className="font-mono text-xs text-neutral-500">
            {folder.count} {folder.count === 1 ? "project" : "projects"}
          </span>
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-neutral-50 sm:text-5xl">
          {folder.name}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-400">
          {folder.description}
        </p>
      </div>
      {projects.length ? (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-neutral-400">No public projects here yet.</p>
      )}
    </div>
  );
}
