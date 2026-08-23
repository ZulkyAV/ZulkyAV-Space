import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard, StatusBadge } from "@/components/ui";
import { getPublicShopFolder } from "@/lib/data/public-shop";

export default async function ProductFolderPage({ params }: { params: Promise<{ folderSlug: string }> }) {
  const { folderSlug } = await params;
  const result = await getPublicShopFolder(folderSlug);
  if (!result) notFound();
  return <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24"><Link href="/jualan" className="text-sm font-semibold text-primary-300">← The shop</Link><div className="mt-12 border-b border-white/10 pb-10"><StatusBadge status={result.folder.status} /><h1 className="mt-5 text-4xl font-bold tracking-tight text-neutral-50 sm:text-5xl">{result.folder.name}</h1><p className="mt-5 max-w-xl text-lg leading-8 text-neutral-400">{result.folder.description}</p></div><div className="mt-10 grid gap-6 md:grid-cols-3">{result.products.length ? result.products.map((product) => <ProductCard key={product.slug} product={product} />) : <p className="text-neutral-400">No active products here yet.</p>}</div></div>;
}
