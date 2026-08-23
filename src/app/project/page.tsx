import { FolderCard } from "@/components/ui";
import { PageShell } from "@/components/page-shell";
import { getPublicProjectIndex } from "@/lib/data/public-projects";

export const revalidate = 300;

export default async function ProjectPage() {
  const { folders, error } = await getPublicProjectIndex();

  return (
    <PageShell
      eyebrow="Work in progress"
      title="Things I’m building."
      description="Kumpulan project, eksperimen, dan ide yang lagi gw develop jadi sesuatu yang lebih nyata."
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
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#14141A] p-10 text-center">
          <p className="font-semibold text-neutral-200">
            No public Project folders yet.
          </p>
        </div>
      ) : null}

    </PageShell>
  );
}
