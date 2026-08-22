import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectCard, StatusBadge } from "@/components/ui";
import { getFolder, projectFolders, projects } from "@/data/mock-data";

export default async function ProjectFolderPage({ params }: { params: Promise<{ folderSlug: string }> }) { const { folderSlug } = await params; const folder = getFolder(projectFolders, folderSlug); if (!folder || folder.status !== "published") notFound(); const folderProjects = projects.filter((project) => project.folderSlug === folder.slug); return <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24"><Link href="/project" className="text-sm font-semibold text-primary-700">← All projects</Link><div className="mt-12 border-b border-neutral-200 pb-10"><StatusBadge status={folder.status} /><h1 className="mt-5 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">{folder.name}</h1><p className="mt-5 max-w-xl text-lg leading-8 text-neutral-500">{folder.description}</p></div><div className="mt-10 grid gap-6 md:grid-cols-3">{folderProjects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div></div>; }
