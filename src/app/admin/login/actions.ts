"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

const CHALLENGE_COOKIE = "admin_auth_challenge";
const CHALLENGE_MINUTES = 10;
const VERIFIED_SESSION_HOURS = 12;
const MAX_OTP_ATTEMPTS = 5;

export type LoginState = {
  step: "credentials" | "otp";
  error?: string;
  message?: string;
};

function normalizeUsername(value: FormDataEntryValue | null) {
  return String(value ?? "").normalize("NFKC").trim().toLowerCase();
}

function createTransientAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return createSupabaseClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function genericCredentialError(): LoginState {
  return {
    step: "credentials",
    error: "Username atau password salah.",
  };
}

export async function startAdminLogin(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return {
      step: "credentials",
      error: "Username dan password wajib diisi.",
    };
  }

  const admin = createAdminClient();
  const { data: accounts, error: accountError } = await admin
    .from("admin_accounts")
    .select("user_id, username, is_active")
    .eq("is_active", true);

  if (accountError) {
    return {
      step: "credentials",
      error: "Login belum dapat diproses. Coba lagi sebentar.",
    };
  }

  const account = accounts?.find(
    (candidate) =>
      candidate.username.normalize("NFKC").trim().toLowerCase() === username,
  );

  if (!account) {
    return genericCredentialError();
  }

  const { data: userData, error: userError } =
    await admin.auth.admin.getUserById(account.user_id);
  const email = userData.user?.email;

  if (userError || !email) {
    return genericCredentialError();
  }

  const auth = createTransientAuthClient();
  const { error: passwordError } = await auth.auth.signInWithPassword({
    email,
    password,
  });

  if (passwordError) {
    return genericCredentialError();
  }

  const expiresAt = new Date(
    Date.now() + CHALLENGE_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: challenge, error: challengeError } = await admin
    .from("admin_auth_challenges")
    .insert({
      user_id: account.user_id,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (challengeError || !challenge) {
    await auth.auth.signOut({ scope: "local" });
    return {
      step: "credentials",
      error: "Gagal menyiapkan verifikasi. Coba lagi.",
    };
  }

  const { error: otpError } = await auth.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  await auth.auth.signOut({ scope: "local" });

  if (otpError) {
    await admin.from("admin_auth_challenges").delete().eq("id", challenge.id);
    return {
      step: "credentials",
      error: "Kode verifikasi gagal dikirim. Coba lagi nanti.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE, challenge.id, {
    httpOnly: true,
    maxAge: CHALLENGE_MINUTES * 60,
    path: "/admin",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return {
    step: "otp",
    message: "Kode verifikasi sudah dikirim ke email terdaftar.",
  };
}

export async function verifyAdminOtp(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const token = String(formData.get("token") ?? "").trim();
  const cookieStore = await cookies();
  const challengeId = cookieStore.get(CHALLENGE_COOKIE)?.value;

  if (!/^\d{6}$/.test(token)) {
    return {
      step: "otp",
      error: "Masukkan kode 6 digit yang dikirim ke email.",
    };
  }

  if (!challengeId) {
    return {
      step: "credentials",
      error: "Sesi verifikasi sudah berakhir. Silakan login ulang.",
    };
  }

  const admin = createAdminClient();
  const { data: challenge, error: challengeError } = await admin
    .from("admin_auth_challenges")
    .select("id, user_id, attempts, expires_at, consumed_at")
    .eq("id", challengeId)
    .maybeSingle();

  const expired =
    !challenge ||
    Boolean(challenge.consumed_at) ||
    new Date(challenge.expires_at).getTime() <= Date.now();

  if (challengeError || expired) {
    cookieStore.delete(CHALLENGE_COOKIE);
    return {
      step: "credentials",
      error: "Sesi verifikasi sudah berakhir. Silakan login ulang.",
    };
  }

  const nextAttempts = challenge.attempts + 1;
  await admin
    .from("admin_auth_challenges")
    .update({ attempts: nextAttempts })
    .eq("id", challenge.id);

  if (nextAttempts > MAX_OTP_ATTEMPTS) {
    await admin
      .from("admin_auth_challenges")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", challenge.id);
    cookieStore.delete(CHALLENGE_COOKIE);
    return {
      step: "credentials",
      error: "Terlalu banyak percobaan. Silakan login ulang.",
    };
  }

  const { data: userData, error: userError } =
    await admin.auth.admin.getUserById(challenge.user_id);
  const email = userData.user?.email;

  if (userError || !email) {
    return {
      step: "otp",
      error: "Verifikasi belum dapat diproses. Coba lagi.",
    };
  }

  const supabase = await createServerClient();
  const { data: verification, error: otpError } =
    await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

  if (
    otpError ||
    !verification.session ||
    verification.user?.id !== challenge.user_id
  ) {
    return {
      step: "otp",
      error: "Kode salah atau sudah kedaluwarsa.",
    };
  }

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims(verification.session.access_token);
  const sessionId = claimsData?.claims?.session_id;

  if (claimsError || typeof sessionId !== "string") {
    await supabase.auth.signOut({ scope: "local" });
    return {
      step: "credentials",
      error: "Session tidak dapat diverifikasi. Silakan login ulang.",
    };
  }

  const verifiedUntil = new Date(
    Date.now() + VERIFIED_SESSION_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { error: sessionError } = await admin
    .from("admin_verified_sessions")
    .upsert({
      session_id: sessionId,
      user_id: challenge.user_id,
      expires_at: verifiedUntil,
    });

  if (sessionError) {
    await supabase.auth.signOut({ scope: "local" });
    return {
      step: "credentials",
      error: "Session admin gagal dibuat. Silakan login ulang.",
    };
  }

  await admin
    .from("admin_auth_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", challenge.id);

  cookieStore.delete(CHALLENGE_COOKIE);
  redirect("/admin");
}
