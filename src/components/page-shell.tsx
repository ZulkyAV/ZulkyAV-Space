import { Eyebrow } from "@/components/ui";

export function PageShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) { return <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24"><div className="mb-14 max-w-2xl"><Eyebrow>{eyebrow}</Eyebrow><h1 className="text-4xl font-bold tracking-tight text-neutral-50 sm:text-5xl">{title}</h1><p className="mt-5 text-lg leading-8 text-neutral-400">{description}</p></div>{children}</div>; }
