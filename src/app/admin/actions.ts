"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function logoutAdmin() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const sessionId = claimsData?.claims?.session_id;

  try {
    if (typeof sessionId === "string" && sessionId.length > 0) {
      const adminClient = createAdminClient();

      await adminClient
        .from("admin_verified_sessions")
        .delete()
        .eq("session_id", sessionId);
    }
  } finally {
    await supabase.auth.signOut();
  }

  redirect("/admin/login");
}
