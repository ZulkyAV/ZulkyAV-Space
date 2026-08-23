import { AdminShell } from "@/components/admin-shell";
import { NoteArticleManager } from "@/app/admin/note/article-manager";
import { NoteFolderManager } from "@/app/admin/note/folder-manager";
import { getAdminNoteArticles } from "@/lib/data/admin-note-articles";
import { getAdminNoteFolders } from "@/lib/data/admin-notes";

export const dynamic = "force-dynamic";

export default async function AdminNotePage() {
  const [folderResult, articleResult] = await Promise.all([
    getAdminNoteFolders(),
    getAdminNoteArticles(),
  ]);

  return (
    <AdminShell
      title="Notes"
      description="Manage folders, drafts, and published articles."
    >
      <div className="space-y-10">
        <NoteFolderManager
          folders={folderResult.folders}
          loadError={folderResult.error}
        />
        <NoteArticleManager
          folders={folderResult.folders}
          articles={articleResult.articles}
          loadError={articleResult.error}
        />
      </div>
    </AdminShell>
  );
}
