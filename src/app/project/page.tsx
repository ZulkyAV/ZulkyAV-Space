import { FolderCard, ProjectCard } from "@/components/ui";
import { PageShell } from "@/components/page-shell";
import { getPublicFolders, projectFolders, projects } from "@/data/mock-data";

export default function ProjectPage() { return <PageShell eyebrow="The workshop" title="Projects in progress." description="A record of experiments, tools, and ideas being shaped into something useful."><div className="grid gap-5 md:grid-cols-3">{getPublicFolders(projectFolders).map((folder) => <FolderCard key={folder.slug} folder={folder} basePath="/project" />)}</div><div className="mt-20"><h2 className="mb-6 text-2xl font-bold text-neutral-950">Selected builds</h2><div className="grid gap-6 md:grid-cols-3">{projects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div></div></PageShell>; }
