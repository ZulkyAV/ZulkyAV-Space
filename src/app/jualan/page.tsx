import { FolderCard, ProductCard } from "@/components/ui";
import { PageShell } from "@/components/page-shell";
import { getPublishedFolders, productFolders, products } from "@/data/mock-data";

export default function JualanPage() { return <PageShell eyebrow="The small shop" title="Useful things, made slowly." description="A small collection of studio goods and digital tools. Limited by design, considered in detail."><div className="grid gap-5 md:grid-cols-3">{getPublishedFolders(productFolders).map((folder) => <FolderCard key={folder.slug} folder={folder} basePath="/jualan" />)}</div><div className="mt-20"><div className="mb-6 flex items-end justify-between"><h2 className="text-2xl font-bold text-neutral-950">The shelf</h2><span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">Mock catalogue</span></div><div className="grid gap-6 md:grid-cols-3">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div></div></PageShell>; }
