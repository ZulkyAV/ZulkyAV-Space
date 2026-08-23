"use client";

import { useActionState, useState } from "react";
import {
  archiveNoteFolder,
  createNoteFolder,
  updateNoteFolder,
  type NoteFolderFormState,
} from "@/app/admin/note/actions";
import {
  noteFolderAccents,
  noteFolderStatuses,
  type AdminNoteFolder,
  type NoteFolderStatus,
} from "@/types/note-admin";

const initialState: NoteFolderFormState = { status: "idle", message: "" };

const inputClassName =
  "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

const statusClasses: Record<NoteFolderStatus, string> = {
  published: "bg-success-50 text-success-700",
  maintenance: "bg-warning-50 text-warning-700",
  draft: "bg-neutral-100 text-neutral-600",
  archived: "bg-neutral-900 text-white",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ResultMessage({ state }: { state: NoteFolderFormState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`rounded-xl px-4 py-3 text-sm ${
        state.status === "success"
          ? "bg-success-50 text-success-700"
          : "bg-error-50 text-error-700"
      }`}
      role="status"
    >
      {state.message}
    </p>
  );
}

function CreateFolderForm() {
  const [state, formAction, pending] = useActionState(
    createNoteFolder,
    initialState,
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <details className="rounded-2xl border border-primary-200 bg-primary-50/40 p-5 sm:p-6">
      <summary className="cursor-pointer list-none font-semibold text-primary-800">
        <span className="mr-2 text-lg">＋</span> Add Note folder
      </summary>

      <form action={formAction} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-neutral-700">
            Folder name
            <input
              name="name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slugEdited) setSlug(slugify(nextName));
              }}
              placeholder="Jurnal Trading"
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-semibold text-neutral-700">
            Slug
            <input
              name="slug"
              required
              maxLength={100}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(slugify(event.target.value));
              }}
              placeholder="jurnal-trading"
              className={inputClassName}
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-neutral-700">
          Description
          <textarea
            name="description"
            maxLength={500}
            rows={3}
            placeholder="Catatan analisis dan perkembangan belajar."
            className={inputClassName}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField name="accent" label="Accent" defaultValue="blue" />
          <SelectField name="status" label="Status" defaultValue="draft" />
          <label className="text-sm font-semibold text-neutral-700">
            Sort order
            <input
              name="sortOrder"
              type="number"
              min={0}
              max={9999}
              step={1}
              defaultValue={0}
              className={inputClassName}
            />
          </label>
        </div>

        <ResultMessage state={state} />

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create folder"}
        </button>
      </form>
    </details>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
}: {
  name: "accent" | "status";
  label: string;
  defaultValue: string;
}) {
  const values = name === "accent" ? noteFolderAccents : noteFolderStatuses;

  return (
    <label className="text-sm font-semibold text-neutral-700">
      {label}
      <select name={name} defaultValue={defaultValue} className={inputClassName}>
        {values.map((value) => (
          <option key={value} value={value}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}

function FolderEditor({ folder }: { folder: AdminNoteFolder }) {
  const [updateState, updateAction, updating] = useActionState(
    updateNoteFolder,
    initialState,
  );
  const [archiveState, archiveAction, archiving] = useActionState(
    archiveNoteFolder,
    initialState,
  );

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-neutral-900">{folder.name}</h2>
          <p className="mt-1 font-mono text-[11px] text-neutral-400">
            /note/{folder.slug}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
            {folder.noteCount} {folder.noteCount === 1 ? "article" : "articles"}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[folder.status]}`}
          >
            {folder.status}
          </span>
        </div>
      </div>

      <details className="mt-5 border-t border-neutral-200 pt-5">
        <summary className="cursor-pointer text-sm font-semibold text-primary-700">
          Edit folder
        </summary>

        <form action={updateAction} className="mt-5 space-y-5">
          <input type="hidden" name="id" value={folder.id} />

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-neutral-700">
              Folder name
              <input
                name="name"
                required
                maxLength={100}
                defaultValue={folder.name}
                className={inputClassName}
              />
            </label>
            <label className="text-sm font-semibold text-neutral-700">
              Slug
              <input
                name="slug"
                required
                maxLength={100}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                defaultValue={folder.slug}
                className={inputClassName}
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-neutral-700">
            Description
            <textarea
              name="description"
              maxLength={500}
              rows={3}
              defaultValue={folder.description}
              className={inputClassName}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-3">
            <SelectField
              name="accent"
              label="Accent"
              defaultValue={folder.accent}
            />
            <SelectField
              name="status"
              label="Status"
              defaultValue={folder.status}
            />
            <label className="text-sm font-semibold text-neutral-700">
              Sort order
              <input
                name="sortOrder"
                type="number"
                min={0}
                max={9999}
                step={1}
                defaultValue={folder.sortOrder}
                className={inputClassName}
              />
            </label>
          </div>

          <ResultMessage state={updateState} />

          <button
            type="submit"
            disabled={updating}
            className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating ? "Saving..." : "Save changes"}
          </button>
        </form>

        {folder.status !== "archived" ? (
          <form action={archiveAction} className="mt-5 border-t border-neutral-200 pt-5">
            <input type="hidden" name="id" value={folder.id} />
            <p className="mb-3 text-xs leading-5 text-neutral-500">
              Archiving hides this folder publicly without deleting its articles.
            </p>
            <ResultMessage state={archiveState} />
            <button
              type="submit"
              disabled={archiving}
              className="mt-3 rounded-xl border border-error-200 bg-white px-4 py-2.5 text-sm font-semibold text-error-700 transition hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {archiving ? "Archiving..." : "Archive folder"}
            </button>
          </form>
        ) : null}
      </details>
    </article>
  );
}

export function NoteFolderManager({
  folders,
  loadError,
}: {
  folders: AdminNoteFolder[];
  loadError: string;
}) {
  const publishedCount = folders.filter(
    (folder) => folder.status === "published",
  ).length;

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Summary label="All folders" value={folders.length} />
        <Summary label="Published" value={publishedCount} />

      </div>

      <CreateFolderForm />

      {loadError ? (
        <p className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">
          {loadError}
        </p>
      ) : null}

      <div className="space-y-4">
        {folders.length ? (
          folders.map((folder) => <FolderEditor key={folder.id} folder={folder} />)
        ) : loadError ? null : (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <p className="font-semibold text-neutral-800">No Note folders yet.</p>
            <p className="mt-2 text-sm text-neutral-500">
              Add the first folder using the form above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
