import { FolderCard } from "@/components/ui";
import { PageShell } from "@/components/page-shell";
import { getPublicShopIndex } from "@/lib/data/public-shop";

export const revalidate = 300;

export default async function JualanPage() {
  const { folders, error } = await getPublicShopIndex();
  return <PageShell eyebrow="Small ventures" title="Made and available." description="Produk dari small ventures yang lagi gw jalanin, lengkap dengan pilihan menu dan update stoknya.">
    {error ? <p className="mb-6 rounded-xl bg-warning-50 p-4 text-sm text-warning-700">{error}</p> : null}
    <div className="grid gap-5 md:grid-cols-3">{folders.map((folder) => <FolderCard key={folder.slug} folder={folder} basePath="/jualan" />)}</div>
    {!error && !folders.length ? <div className="rounded-2xl border border-dashed border-white/15 bg-[#14141A] p-10 text-center"><p className="font-semibold text-neutral-200">No public shop folders yet.</p></div> : null}
  </PageShell>;
}
