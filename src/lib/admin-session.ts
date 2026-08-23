import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getApprovedAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_approved_admin");

  return adminError || isAdmin !== true ? null : supabase;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function readFormText(
  formData: FormData,
  key: string,
  maxLength: number,
) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

export function isSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
