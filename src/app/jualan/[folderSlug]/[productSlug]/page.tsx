import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow, StatusBadge } from "@/components/ui";
import { getPortfolioProfile } from "@/lib/data/profile";
import { getPublicProduct } from "@/lib/data/public-shop";

function createWhatsAppLink(baseHref: string, message: string) {
  try {
    const url = new URL(baseHref);
    if (url.hostname !== "wa.me" && !url.hostname.endsWith(".whatsapp.com")) return "";
    url.searchParams.set("text", message);
    return url.toString();
  } catch {
    return "";
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ folderSlug: string; productSlug: string }> }) {
  const { folderSlug, productSlug } = await params;
  const [result, profile] = await Promise.all([
    getPublicProduct(folderSlug, productSlug),
    getPortfolioProfile(),
  ]);
  if (!result) notFound();
  const { product, folder } = result;
  const whatsappBase = profile.socials.find(
    (social) => social.label.toLowerCase() === "whatsapp",
  )?.href ?? "";
  const orderLink = createWhatsAppLink(
    whatsappBase,
    `Halo ZulkyAV, saya mau order.\n\nProduk: ${product.name}\nHarga: ${product.priceLabel}\nJumlah: 1\n\nMohon konfirmasi ketersediaan dan cara pembayarannya.`,
  );
  const consultationLink = createWhatsAppLink(
    whatsappBase,
    `Halo ZulkyAV, saya ingin konsultasi dulu tentang ${product.name}.`,
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-24">
      <Link href={`/jualan/${folder.slug}`} className="text-sm font-semibold text-primary-300">
        ← {folder.name}
      </Link>
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-[#1B1B23]">
          {product.image ? (
            <img src={product.image} alt={product.name} className="aspect-square h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-neutral-500">No image yet</div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <Eyebrow>{folder.name}</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {product.labels.map((label) => (
              <span key={label} className="rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-300">
                {label}
              </span>
            ))}
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-neutral-50 sm:text-5xl">{product.name}</h1>
          <p className="mt-5 text-lg leading-8 text-neutral-400">{product.description}</p>
          <div className="mt-8 flex items-center gap-4">
            <span className="font-mono text-xl text-neutral-100">{product.priceLabel}</span>
            <StatusBadge status={product.stock} />
          </div>
          {orderLink && consultationLink ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={orderLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#25D366] px-5 py-3 text-center text-sm font-bold text-[#07140C] transition hover:bg-[#37E879]"
              >
                Langsung order via WhatsApp
              </a>
              <a
                href={consultationLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/15 bg-[#14141A] px-5 py-3 text-center text-sm font-semibold text-neutral-100 transition hover:border-primary-400/60 hover:text-primary-300"
              >
                Konsultasi via WhatsApp
              </a>
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-white/10 bg-[#1B1B23] p-4 text-sm text-neutral-400">
              Contact details for ordering are being prepared.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-neutral-500">
            Stock is recorded live. Payment details will be confirmed privately through WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
