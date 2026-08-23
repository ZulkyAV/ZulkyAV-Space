"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createNoteArticle,
  updateNoteArticle,
  type NoteArticleFormState,
} from "@/app/admin/note/article-actions";
import type { AdminNoteArticle } from "@/types/note-article-admin";
import type { AdminNoteFolder } from "@/types/note-admin";

const initialState: NoteArticleFormState = { status: "idle", message: "" };
const inputClassName =
  "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ResultMessage({ state }: { state: NoteArticleFormState }) {
  if (!state.message) return null;

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

function FolderSelect({
  folders,
  defaultValue,
}: {
  folders: AdminNoteFolder[];
  defaultValue?: string | null;
}) {
  return (
    <label className="text-sm font-semibold text-neutral-700">
      Folder
      <select
        name="folderId"
        required
        defaultValue={defaultValue ?? ""}
        className={inputClassName}
      >
        <option value="" disabled>
          Choose a folder
        </option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name} ({folder.status})
          </option>
        ))}
      </select>
    </label>
  );
}

function ArticleFields({
  folders,
  article,
}: {
  folders: AdminNoteFolder[];
  article?: AdminNoteArticle;
}) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(article));

  return (
    <>
      {article ? <input type="hidden" name="id" value={article.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-neutral-700">
          Article title
          <input
            name="title"
            required
            maxLength={160}
            value={title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              setTitle(nextTitle);
              if (!slugEdited) setSlug(slugify(nextTitle));
            }}
            placeholder="Hal kecil yang ingin disimpan"
            className={inputClassName}
          />
        </label>

        <label className="text-sm font-semibold text-neutral-700">
          Slug
          <input
            name="slug"
            required
            maxLength={140}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(slugify(event.target.value));
            }}
            placeholder="hal-kecil-yang-ingin-disimpan"
            className={inputClassName}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FolderSelect folders={folders} defaultValue={article?.folderId} />
        <label className="text-sm font-semibold text-neutral-700">
          Publication
          <select
            name="publication"
            defaultValue={article?.published ? "published" : "draft"}
            className={inputClassName}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-semibold text-neutral-700">
        Excerpt
        <textarea
          name="excerpt"
          required
          maxLength={500}
          rows={3}
          defaultValue={article?.excerpt ?? ""}
          placeholder="Ringkasan pendek yang tampil di daftar artikel."
          className={inputClassName}
        />
      </label>

      <label className="block text-sm font-semibold text-neutral-700">
        Article content
        <textarea
          name="content"
          required
          maxLength={50000}
          rows={14}
          defaultValue={article?.content ?? ""}
          placeholder={"Tulis isi artikel di sini.\n\nPisahkan paragraf dengan satu baris kosong."}
          className={`${inputClassName} font-mono leading-7`}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="text-sm font-semibold text-neutral-700 sm:col-span-2">
          Tags
          <input
            name="tags"
            maxLength={500}
            defaultValue={article?.tags.join(", ") ?? ""}
            placeholder="process, making, diary"
            className={inputClassName}
          />
          <span className="mt-2 block text-xs font-normal text-neutral-400">
            Separate tags with commas. Maximum 10 tags.
          </span>
        </label>

        <label className="text-sm font-semibold text-neutral-700">
          Read time
          <input
            name="readTime"
            maxLength={50}
            defaultValue={article?.readTime ?? ""}
            placeholder="5 min read"
            className={inputClassName}
          />
        </label>
      </div>

      <label className="block max-w-xs text-sm font-semibold text-neutral-700">
        Sort order
        <input
          name="sortOrder"
          type="number"
          min={0}
          max={9999}
          step={1}
          defaultValue={article?.sortOrder ?? 0}
          className={inputClassName}
        />
      </label>

    </>
  );
}

function CreateArticleForm({ folders }: { folders: AdminNoteFolder[] }) {
  const [state, formAction, pending] = useActionState(
    createNoteArticle,
    initialState,
  );

  if (!folders.length) {
    return (
      <div className="rounded-2xl border border-warning-200 bg-warning-50 p-5 text-sm text-warning-700">
        Create a Note folder before adding an article.
      </div>
    );
  }

  return (
    <details className="rounded-2xl border border-primary-200 bg-primary-50/40 p-5 sm:p-6">
      <summary className="cursor-pointer list-none font-semibold text-primary-800">
        <span className="mr-2 text-lg">＋</span> Add Note article
      </summary>
      <form action={formAction} className="mt-6 space-y-5">
        <ArticleFields folders={folders} />
        <ResultMessage state={state} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create article"}
        </button>
      </form>
    </details>
  );
}

function ArticleEditor({
  article,
  folders,
}: {
  article: AdminNoteArticle;
  folders: AdminNoteFolder[];
}) {
  const [state, formAction, pending] = useActionState(
    updateNoteArticle,
    initialState,
  );
  const folder = folders.find((entry) => entry.id === article.folderId);

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-neutral-900">{article.title}</h3>
          <p className="mt-1 font-mono text-[11px] text-neutral-400">
            {folder ? `/note/${folder.slug}/${article.slug}` : article.slug}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
            {folder?.name ?? "No folder"}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              article.published
                ? "bg-success-50 text-success-700"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {article.published ? "published" : "draft"}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-neutral-500">{article.excerpt}</p>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
        Updated {article.updatedAt.slice(0, 10)}
      </p>

      <details className="mt-5 border-t border-neutral-200 pt-5">
        <summary className="cursor-pointer text-sm font-semibold text-primary-700">
          Edit article
        </summary>
        <form action={formAction} className="mt-5 space-y-5">
          <ArticleFields folders={folders} article={article} />
          <ResultMessage state={state} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save article"}
          </button>
        </form>
      </details>
    </article>
  );
}

export function NoteArticleManager({
  folders,
  articles,
  loadError,
}: {
  folders: AdminNoteFolder[];
  articles: AdminNoteArticle[];
  loadError: string;
}) {
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [publicationFilter, setPublicationFilter] = useState("all");

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesQuery =
        !normalizedQuery ||
        article.title.toLowerCase().includes(normalizedQuery) ||
        article.slug.toLowerCase().includes(normalizedQuery);
      const matchesFolder =
        folderFilter === "all" || article.folderId === folderFilter;
      const matchesPublication =
        publicationFilter === "all" ||
        (publicationFilter === "published" ? article.published : !article.published);
      return matchesQuery && matchesFolder && matchesPublication;
    });
  }, [articles, folderFilter, publicationFilter, query]);

  return (
    <section className="space-y-7 border-t border-neutral-200 pt-10">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600">
          Article manager
        </p>
        <h2 className="mt-2 text-2xl font-bold text-neutral-950">
          Articles ({articles.length})
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Draft, publish, and organize the writing inside each Note folder.
        </p>
      </div>

      <CreateArticleForm folders={folders} />

      <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Search
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title or slug"
            className={inputClassName}
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Folder
          <select
            value={folderFilter}
            onChange={(event) => setFolderFilter(event.target.value)}
            className={inputClassName}
          >
            <option value="all">All folders</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Status
          <select
            value={publicationFilter}
            onChange={(event) => setPublicationFilter(event.target.value)}
            className={inputClassName}
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>
      </div>

      {loadError ? (
        <p className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">
          {loadError}
        </p>
      ) : null}

      <div className="space-y-4">
        {filteredArticles.length ? (
          filteredArticles.map((article) => (
            <ArticleEditor key={article.id} article={article} folders={folders} />
          ))
        ) : loadError ? null : (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <p className="font-semibold text-neutral-800">No matching articles.</p>
            <p className="mt-2 text-sm text-neutral-500">
              Add an article or change the filters above.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
