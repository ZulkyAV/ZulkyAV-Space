import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";
import { Eyebrow } from "@/components/ui";

const adminLinks = [
  "portfolio",
  "note",
  "project",
  "jualan",
  "transactions",
  "statistics",
  "settings",
];

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
      <div className="mb-10 flex flex-col justify-between gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
        <div>
          <Eyebrow>Private workspace</Eyebrow>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-50">
            {title}
          </h1>
          <p className="mt-2 text-sm text-neutral-400">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="text-sm font-semibold text-primary-300">
            Back to public space ↗
          </Link>

          <form action={logoutAdmin}>
            <button
              type="submit"
              className="rounded-lg border border-white/15 bg-[#14141A] px-3 py-2 text-sm font-semibold text-neutral-300 transition-colors hover:border-error-200 hover:bg-error-50 hover:text-error-700"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <aside className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
          {adminLinks.map((link) => (
            <Link
              key={link}
              href={`/admin/${link}`}
              className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm capitalize text-neutral-400 hover:bg-primary-50 hover:text-primary-300"
            >
              {link}
            </Link>
          ))}
        </aside>

        <section>{children}</section>
      </div>
    </div>
  );
}
