"use client";

import { useActionState, useState } from "react";
import { AdminImageUploader } from "@/components/admin-image-uploader";
import {
  archiveProjectContent,
  createProjectContent,
  updateProjectContent,
  type ProjectContentState,
} from "@/app/admin/project/content-actions";
import type {
  AdminProjectContent,
  AdminProjectFolderOption,
} from "@/types/project-content-admin";

const initialState: ProjectContentState = { status: "idle", message: "" };
const input = "mt-2 w-full rounded-xl border border-white/15 bg-[#14141A] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function Message({ state }: { state: ProjectContentState }) {
  return state.message ? (
    <p className={`rounded-xl px-4 py-3 text-sm ${state.status === "success" ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700"}`}>
      {state.message}
    </p>
  ) : null;
}

function ProjectFields({
  folders,
  project,
}: {
  folders: AdminProjectFolderOption[];
  project?: AdminProjectContent;
}) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-neutral-300">Folder
          <select name="folderId" required defaultValue={project?.folderId ?? folders[0]?.id ?? ""} className={input}>
            <option value="" disabled>Choose folder</option>
            {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name} · {folder.status}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-neutral-300">Title
          <input name="title" required maxLength={160} defaultValue={project?.title} className={input} />
        </label>
      </div>
      <label className="block text-sm font-semibold text-neutral-300">Slug
        <input name="slug" required maxLength={140} defaultValue={project?.slug} placeholder="chicken-teriyaki" className={input} />
      </label>
      <label className="block text-sm font-semibold text-neutral-300">Description
        <textarea name="description" rows={4} maxLength={3000} defaultValue={project?.description} className={input} />
      </label>
      <AdminImageUploader scope="project" initialUrl={project?.imageUrl} initialPublicId={project?.imagePublicId} />
      <div className="grid gap-5 sm:grid-cols-4">
        <label className="text-sm font-semibold text-neutral-300">Type
          <select name="projectType" defaultValue={project?.projectType ?? "other"} className={input}>
            {['food','drink','iot','web','other'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-neutral-300">Stage
          <select name="stage" defaultValue={project?.stage ?? "idea"} className={input}>
            {['idea','experiment','active','paused','completed'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-neutral-300">Visibility
          <select name="publication" defaultValue={project?.isPublished ? "published" : "draft"} className={input}>
            <option value="draft">private/draft</option><option value="published">published</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-neutral-300">Sort order
          <input name="sortOrder" type="number" min={0} max={9999} defaultValue={project?.sortOrder ?? 0} className={input} />
        </label>
      </div>
      <label className="block text-sm font-semibold text-neutral-300">Components / ingredients
        <textarea name="components" rows={6} defaultValue={project?.componentsText} placeholder="Ayam | ingredient | 250 | gram | supplier A&#10;Bawang merah | ingredient | 3 | siung | catatan private" className={`${input} font-mono text-xs`} />
        <span className="mt-2 block text-xs font-normal text-neutral-400">One line: name | kind | private quantity | unit | private note. Public only sees the name and kind.</span>
      </label>
      <label className="block text-sm font-semibold text-neutral-300">Progress updates
        <textarea name="updates" rows={6} defaultValue={project?.updatesText} placeholder="2026-08-23 | public | First test | Sauce balance improved&#10;2026-08-24 | private | Cost check | Internal note" className={`${input} font-mono text-xs`} />
        <span className="mt-2 block text-xs font-normal text-neutral-400">One line: YYYY-MM-DD | public/private | title | content.</span>
      </label>
    </>
  );
}

function CreateProject({ folders }: { folders: AdminProjectFolderOption[] }) {
  const [state, action, pending] = useActionState(createProjectContent, initialState);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  return (
    <details className="rounded-2xl border border-primary-200 bg-primary-50/40 p-6">
      <summary className="cursor-pointer font-semibold text-primary-200">＋ Add project</summary>
      <form action={action} className="mt-6 space-y-5" onChange={(event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.name === "title") {
          setTitle(target.value);
          if (!slug) setSlug(slugify(target.value));
        }
      }}>
        <ProjectFields folders={folders} />
        <input type="hidden" name="_generatedTitle" value={title} />
        {slug ? <p className="text-xs text-neutral-400">Suggested slug: <button type="button" className="font-mono text-primary-300" onClick={() => navigator.clipboard.writeText(slug)}>{slug}</button></p> : null}
        <Message state={state} />
        <button disabled={pending || !folders.length} className="rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Creating..." : "Create project"}</button>
      </form>
    </details>
  );
}

function ProjectEditor({ project, folders }: { project: AdminProjectContent; folders: AdminProjectFolderOption[] }) {
  const [state, action, pending] = useActionState(updateProjectContent, initialState);
  const [archiveState, archiveAction, archiving] = useActionState(archiveProjectContent, initialState);
  return (
    <details className="rounded-2xl border border-white/10 bg-[#14141A] p-6 shadow-sm">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-bold text-neutral-100">{project.title}</h3><p className="mt-1 font-mono text-[11px] text-neutral-500">{project.slug}</p></div>
          <div className="flex gap-2"><span className="rounded-full bg-[#1B1B23] px-3 py-1 text-xs">{project.stage}</span><span className={`rounded-full px-3 py-1 text-xs ${project.isPublished ? 'bg-success-50 text-success-700' : 'bg-[#1B1B23] text-neutral-400'}`}>{project.isPublished ? 'published' : 'private'}</span></div>
        </div>
      </summary>
      <form action={action} className="mt-6 space-y-5 border-t border-white/10 pt-6">
        <input type="hidden" name="id" value={project.id} />
        <ProjectFields folders={folders} project={project} />
        <Message state={state} />
        <button disabled={pending} className="rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? 'Saving...' : 'Save project'}</button>
      </form>
      <form action={archiveAction} className="mt-5 border-t border-white/10 pt-5">
        <input type="hidden" name="id" value={project.id} />
        <Message state={archiveState} />
        <button disabled={archiving} className="mt-3 rounded-xl border border-error-200 px-4 py-2 text-sm font-semibold text-error-700">{archiving ? 'Archiving...' : 'Unpublish & pause'}</button>
      </form>
    </details>
  );
}

export function ProjectContentManager({ folders, projects, loadError }: { folders: AdminProjectFolderOption[]; projects: AdminProjectContent[]; loadError: string }) {
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-neutral-50">Project content</h2><p className="mt-1 text-sm text-neutral-400">Public details and private recipe/component data live together here.</p></div><span className="rounded-full bg-[#1B1B23] px-3 py-1 text-xs font-semibold">{projects.length} projects</span></div>
      {loadError ? <p className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">{loadError}</p> : null}
      <CreateProject folders={folders} />
      <div className="space-y-4">{projects.length ? projects.map((project) => <ProjectEditor key={project.id} project={project} folders={folders} />) : <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-400">No projects yet.</p>}</div>
    </div>
  );
}
