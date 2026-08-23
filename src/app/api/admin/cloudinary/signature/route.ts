import { NextResponse } from "next/server";

import { getCloudinary } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_approved_admin");

  if (adminError || !isAdmin) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const { cloudinary, cloudName, apiKey, apiSecret } = getCloudinary();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "zulkyav-space/avatars";

  const signature = cloudinary.utils.api_sign_request(
    {
      folder,
      timestamp,
    },
    apiSecret,
  );

  return NextResponse.json(
    {
      apiKey,
      cloudName,
      folder,
      signature,
      timestamp,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
