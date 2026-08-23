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
      <div className="mb-10 flex flex-col justify-between gap-5 border-b border-neutral-200 pb-8 sm:flex-row sm:items-end">
        <div>
          <Eyebrow>Private workspace</Eyebrow>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950">
            {title}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="text-sm font-semibold text-primary-700">
            Back to public space ↗
          </Link>

          <form action={logoutAdmin}>
            <button
              type="submit"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-error-200 hover:bg-error-50 hover:text-error-700"
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
              className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm capitalize text-neutral-600 hover:bg-primary-50 hover:text-primary-700"
            >
              {link}
            </Link>
          ))}
        </aside>

        <section>
          {children ?? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
              <p className="text-lg font-semibold text-neutral-800">
                This area is ready for the next phase.
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Content management tools will appear here later.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
