import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#14141A]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-neutral-400 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>© {year} ZulkyAV Space. Made slowly.</p>
        <div className="flex gap-5">
          <Link href="#" className="hover:text-primary-300">GitHub</Link>
          <Link href="#" className="hover:text-primary-300">Instagram</Link>
          <Link href="#" className="hover:text-primary-300">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
