import Link from "next/link";

const links = [
  { label: "About", href: "/" },
  { label: "Notes", href: "/note" },
  { label: "Projects", href: "/project" },
  { label: "Shop", href: "/jualan" },
  { label: "Insights", href: "/statistics" },
];

export function Header() {
  return <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0B0F]/90 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8"><Link href="/" className="group flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white transition-transform group-hover:rotate-6">Z</span><span className="text-sm font-semibold tracking-tight text-neutral-100">ZulkyAV<span className="text-primary-400">.</span></span></Link><nav className="hidden items-center gap-6 md:flex">{links.map((link) => <Link key={link.href} href={link.href} className="text-xs font-semibold text-neutral-300 transition-colors hover:text-primary-300">{link.label}</Link>)}</nav><Link href="/admin/login" className="rounded-full border border-white/15 bg-[#14141A] px-4 py-2 text-xs font-semibold text-neutral-200 shadow-sm transition-all hover:border-primary-400 hover:bg-primary-50 hover:text-primary-300">Private Zone <span className="ml-1 text-primary-400">↗</span></Link></div><nav className="flex gap-6 overflow-x-auto border-t border-white/10 px-5 py-3 md:hidden">{links.map((link) => <Link key={link.href} href={link.href} className="whitespace-nowrap text-xs font-semibold text-neutral-300 transition-colors hover:text-primary-300">{link.label}</Link>)}</nav></header>;
}
