import Link from "next/link";

export function Footer() { return <footer className="border-t border-neutral-200 bg-white"><div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between lg:px-8"><p>© 2024 ZulkyAV Space. Made slowly.</p><div className="flex gap-5"><Link href="#" className="hover:text-primary-700">GitHub</Link><Link href="#" className="hover:text-primary-700">Instagram</Link><Link href="#" className="hover:text-primary-700">Contact</Link></div></div></footer>; }
