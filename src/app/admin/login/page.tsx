import Link from "next/link";
import { Eyebrow } from "@/components/ui";
import { AdminLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Eyebrow>Private zone</Eyebrow>
          <h1 className="text-3xl font-bold text-neutral-50">Welcome back.</h1>
          <p className="mt-3 text-sm text-neutral-400">
            Sign in with your private credentials to continue.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#14141A] p-7 shadow-sm">
          <AdminLoginForm />
          <p className="mt-6 text-center text-xs leading-5 text-neutral-500">
            Protected by password and one-time email verification.
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-sm font-semibold text-primary-300 hover:text-primary-200"
        >
          ← Back to public space
        </Link>
      </div>
    </div>
  );
}
