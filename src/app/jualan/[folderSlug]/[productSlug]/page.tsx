import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow, StatusBadge } from "@/components/ui";
import { getPublicProduct } from "@/lib/data/public-shop";

export default async function ProductDetailPage({ params }: { params: Promise<{ folderSlug: string; productSlug: string }> }) {
  const { folderSlug, productSlug } = await params;
  const result = await getPublicProduct(folderSlug, productSlug);
  if (!result) notFound();
  const { product, folder } = result;
  return <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-24"><Link href={`/jualan/${folder.slug}`} className="text-sm font-semibold text-primary-300">← {folder.name}</Link><div className="mt-12 grid gap-10 lg:grid-cols-2"><div className="overflow-hidden rounded-2xl bg-[#1B1B23]">{product.image ? <img src={product.image} alt={product.name} className="aspect-square h-full w-full object-cover" /> : <div className="flex aspect-square items-center justify-center text-neutral-500">No image yet</div>}</div><div className="flex flex-col justify-center"><Eyebrow>{folder.name}</Eyebrow><div className="flex flex-wrap gap-2">{product.labels.map((label) => <span key={label} className="rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-300">{label}</span>)}</div><h1 className="mt-5 text-4xl font-bold tracking-tight text-neutral-50 sm:text-5xl">{product.name}</h1><p className="mt-5 text-lg leading-8 text-neutral-400">{product.description}</p><div className="mt-8 flex items-center gap-4"><span className="font-mono text-xl text-neutral-100">{product.priceLabel}</span><StatusBadge status={product.stock} /></div><p className="mt-6 rounded-xl bg-[#1B1B23] p-4 text-sm text-neutral-400">Availability is recorded live. Contact the owner directly to order.</p></div></div></div>;
}
