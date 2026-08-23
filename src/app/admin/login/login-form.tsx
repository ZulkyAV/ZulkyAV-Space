"use client";

import { useActionState, useEffect, useState } from "react";
import {
  startAdminLogin,
  verifyAdminOtp,
  type LoginState,
} from "./actions";

const initialCredentialState: LoginState = { step: "credentials" };
const initialOtpState: LoginState = { step: "otp" };

export function AdminLoginForm() {
  const [step, setStep] = useState<LoginState["step"]>("credentials");
  const [credentialState, credentialAction, credentialPending] = useActionState(
    startAdminLogin,
    initialCredentialState,
  );
  const [otpState, otpAction, otpPending] = useActionState(
    verifyAdminOtp,
    initialOtpState,
  );

  useEffect(() => {
    if (credentialState.step === "otp") {
      setStep("otp");
    }
  }, [credentialState]);

  useEffect(() => {
    if (otpState.step === "credentials") {
      setStep("credentials");
    }
  }, [otpState]);

  if (step === "otp") {
    return (
      <form action={otpAction} className="space-y-5">
        <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
          <p className="text-sm font-semibold text-primary-200">
            Check your email
          </p>
          <p className="mt-1 text-sm leading-6 text-primary-300">
            {credentialState.message ??
              "Kode verifikasi sudah dikirim ke email terdaftar."}
          </p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-neutral-300">
            Authentication code
          </span>
          <input
            autoComplete="one-time-code"
            autoFocus
            className="w-full rounded-lg border border-white/15 px-4 py-3 text-center font-mono text-lg tracking-[0.35em] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            inputMode="numeric"
            maxLength={6}
            name="token"
            pattern="[0-9]{6}"
            placeholder="000000"
            required
          />
        </label>

        {otpState.error && (
          <p
            aria-live="polite"
            className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700"
          >
            {otpState.error}
          </p>
        )}

        <button
          className="w-full rounded-lg bg-primary-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={otpPending}
          type="submit"
        >
          {otpPending ? "Verifying..." : "Enter workspace"}
        </button>

        <button
          className="w-full text-center text-xs font-semibold text-neutral-400 hover:text-primary-300"
          onClick={() => setStep("credentials")}
          type="button"
        >
          Use username and password again
        </button>
      </form>
    );
  }

  const credentialError =
    credentialState.error ??
    (otpState.step === "credentials" ? otpState.error : undefined);

  return (
    <form action={credentialAction} className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-neutral-300">
          Username
        </span>
        <input
          autoComplete="username"
          className="w-full rounded-lg border border-white/15 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          name="username"
          placeholder="your username"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-neutral-300">
          Password
        </span>
        <input
          autoComplete="current-password"
          className="w-full rounded-lg border border-white/15 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
      </label>

      {credentialError && (
        <p
          aria-live="polite"
          className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700"
        >
          {credentialError}
        </p>
      )}

      <button
        className="w-full rounded-lg bg-primary-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={credentialPending}
        type="submit"
      >
        {credentialPending ? "Checking..." : "Send authentication code"}
      </button>
    </form>
  );
}
