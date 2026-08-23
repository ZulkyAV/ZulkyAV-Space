import { FolderCard, ProjectCard } from "@/components/ui";
import { PageShell } from "@/components/page-shell";
import { getPublicProjectIndex } from "@/lib/data/public-projects";

export const revalidate = 300;

export default async function ProjectPage() {
  const { folders, projects, error } = await getPublicProjectIndex();

  return (
    <PageShell
      eyebrow="The workshop"
      title="Projects in progress."
      description="A record of experiments, tools, and ideas being shaped into something useful."
    >
      {error ? (
        <p className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-3">
        {folders.map((folder) => (
          <FolderCard key={folder.slug} folder={folder} basePath="/project" />
        ))}
      </div>

      {!error && !folders.length ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-semibold text-neutral-800">
            No public Project folders yet.
          </p>
        </div>
      ) : null}

      <div className="mt-20">
        <h2 className="mb-6 text-2xl font-bold text-neutral-950">
          Selected builds
        </h2>
        {projects.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={`${project.folderSlug}-${project.slug}`}
                project={project}
              />
            ))}
          </div>
        ) : (
          <p className="text-neutral-500">No public projects yet.</p>
        )}
      </div>
    </PageShell>
  );
}
