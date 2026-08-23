"use client";

import { useActionState } from "react";
import {
  updatePortfolio,
  type PortfolioFormState,
} from "@/app/admin/portfolio/actions";
import { AvatarUploader } from "@/app/admin/portfolio/avatar-uploader";
const initialPortfolioFormState: PortfolioFormState = {
  status: "idle",
  message: "",
};
import type { PortfolioProfile } from "@/types/profile";

function socialUrl(profile: PortfolioProfile, label: string) {
  return (
    profile.socials.find(
      (social) => social.label.toLowerCase() === label.toLowerCase(),
    )?.href ?? ""
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

export function PortfolioForm({ profile }: { profile: PortfolioProfile }) {
  const [state, formAction, pending] = useActionState(
    updatePortfolio,
    initialPortfolioFormState,
  );

  return (
    <form action={formAction} className="space-y-8">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-900">Profile content</h2>
          <p className="mt-1 text-sm text-neutral-500">
            These fields appear on the public Portfolio page.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="text-sm font-semibold text-neutral-700">
            Name
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={profile.name}
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-semibold text-neutral-700">
            Location / availability
            <input
              name="location"
              maxLength={120}
              defaultValue={profile.location}
              className={inputClassName}
            />
          </label>
        </div>

        <label className="mt-6 block text-sm font-semibold text-neutral-700">
          Headline
          <input
            name="headline"
            required
            maxLength={180}
            defaultValue={profile.headline}
            className={inputClassName}
          />
        </label>

        <label className="mt-6 block text-sm font-semibold text-neutral-700">
          Intro
          <textarea
            name="intro"
            required
            maxLength={600}
            rows={4}
            defaultValue={profile.intro}
            className={inputClassName}
          />
        </label>

        <label className="mt-6 block text-sm font-semibold text-neutral-700">
          About
          <textarea
            name="about"
            required
            maxLength={1200}
            rows={6}
            defaultValue={profile.about}
            className={inputClassName}
          />
        </label>

        <label className="mt-6 block text-sm font-semibold text-neutral-700">
          Short bio
          <textarea
            name="bio"
            maxLength={500}
            rows={3}
            defaultValue={profile.bio}
            className={inputClassName}
          />
        </label>

        <div className="mt-6">
          <AvatarUploader
            initialUrl={profile.avatarUrl}
            initialPublicId={profile.avatarPublicId}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-neutral-900">Social links</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Leave a field empty to hide that link publicly.
        </p>

        <div className="mt-6 grid gap-6">
          <label className="text-sm font-semibold text-neutral-700">
            GitHub URL
            <input
              name="githubUrl"
              type="url"
              maxLength={1000}
              placeholder="https://github.com/..."
              defaultValue={socialUrl(profile, "GitHub")}
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-semibold text-neutral-700">
            Instagram URL
            <input
              name="instagramUrl"
              type="url"
              maxLength={1000}
              placeholder="https://instagram.com/..."
              defaultValue={socialUrl(profile, "Instagram")}
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-semibold text-neutral-700">
            LinkedIn URL
            <input
              name="linkedinUrl"
              type="url"
              maxLength={1000}
              placeholder="https://linkedin.com/in/..."
              defaultValue={socialUrl(profile, "LinkedIn")}
              className={inputClassName}
            />
          </label>
        </div>
      </div>

      {state.message ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            state.status === "success"
              ? "bg-success-50 text-success-700"
              : "bg-error-50 text-error-700"
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save portfolio"}
      </button>
    </form>
  );
}
