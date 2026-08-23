import Link from "next/link";
import { Eyebrow, SectionHeading } from "@/components/ui";
import { getPortfolioProfile } from "@/lib/data/profile";

export const revalidate = 300;

export default async function HomePage() {
  const profile = await getPortfolioProfile();

  return (
    <>
      <section className="grid-paper border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid items-end gap-12 lg:grid-cols-[1.3fr_.7fr]">
            <div>
              <Eyebrow>A personal space</Eyebrow>
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-neutral-50 sm:text-7xl">
                Just me, my work, and a few things <span className="text-primary-400">worth keeping</span>.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-400">
                {profile.intro}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/project"
                  className="rounded-full bg-primary-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-950/40 transition-colors hover:bg-primary-600"
                >
                  Explore projects <span className="ml-2">→</span>
                </Link>
                <Link
                  href="/note"
                  className="rounded-full border border-white/15 bg-[#14141A] px-5 py-3 text-sm font-semibold text-neutral-300 transition-colors hover:border-primary-400 hover:text-primary-300"
                >
                  Read some notes
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#14141A]/80 p-6 shadow-sm">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="mb-6 aspect-square w-24 rounded-2xl object-cover"
                />
              ) : null}
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Currently
              </p>
              <p className="mt-4 text-xl font-semibold leading-8 text-neutral-200">
                {profile.headline}
              </p>
              <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5">
                <span className="h-2 w-2 rounded-full bg-success-500" />
                <span className="text-sm text-neutral-400">
                  {profile.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <SectionHeading
          title="A bit about me"
          description={profile.about}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-primary-500/20 bg-[#17131F] p-6 text-white shadow-sm">
            <p className="font-mono text-xs text-primary-300">01 / approach</p>
            <p className="mt-12 text-lg font-semibold leading-7">
              Stay curious, bikin jadi nyata.
            </p>
          </div>
          <div className="rounded-2xl border border-accent-500/20 bg-[#21152E] p-6 text-neutral-100 shadow-sm">
            <p className="font-mono text-xs text-accent-300">02 / preference</p>
            <p className="mt-12 text-lg font-semibold leading-7">
              Less stuff, tapi lebih kepikiran.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#121219] p-6 text-white shadow-sm">
            <p className="font-mono text-xs text-neutral-500">03 / reminder</p>
            <p className="mt-12 text-lg font-semibold leading-7">
              Progress nggak harus berisik.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#1B1B23]">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-5 py-12 sm:flex-row sm:items-center lg:px-8">
          <div>
            <Eyebrow>Catch me elsewhere</Eyebrow>
            <p className="text-xl font-semibold text-neutral-100">
              Kalau mau lihat update lainnya, I'm around.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {profile.socials.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                className="rounded-full border border-white/15 bg-[#14141A] px-4 py-2 text-sm font-semibold text-neutral-300 hover:border-primary-400 hover:text-primary-300"
              >
                {social.label} ↗
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
