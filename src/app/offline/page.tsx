import Link from "next/link";

export default function OfflinePage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary-400">ZAV Space</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-50">You are offline.</h1>
      <p className="mt-4 leading-7 text-neutral-400">
        This page needs an internet connection. Reconnect, then try opening it again.
      </p>
      <Link href="/" className="mt-8 rounded-full bg-primary-700 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-600">
        Try again
      </Link>
    </section>
  );
}
