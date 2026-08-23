import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard, StatusBadge } from "@/components/ui";
import { getFolder, productFolders, products } from "@/data/mock-data";

export default async function ProductFolderPage({ params }: { params: Promise<{ folderSlug: string }> }) { const { folderSlug } = await params; const folder = getFolder(productFolders, folderSlug); if (!folder || folder.status !== "published") notFound(); const folderProducts = products.filter((product) => product.folderSlug === folder.slug); return <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24"><Link href="/jualan" className="text-sm font-semibold text-primary-700">← The shop</Link><div className="mt-12 border-b border-neutral-200 pb-10"><StatusBadge status={folder.status} /><h1 className="mt-5 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">{folder.name}</h1><p className="mt-5 max-w-xl text-lg leading-8 text-neutral-500">{folder.description}</p></div><div className="mt-10 grid gap-6 md:grid-cols-3">{folderProducts.map((product) => <ProductCard key={product.slug} product={product} />)}</div></div>; }
