import "server-only";

import { v2 as cloudinary } from "cloudinary";

export function getCloudinary() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return {
    cloudinary,
    cloudName,
    apiKey,
    apiSecret,
  };
}

export async function destroyManagedImage(
  publicId: string | null | undefined,
  scope: "avatar" | "project" | "product",
) {
  const managedPrefix = `zulkyav-space/${scope}s/`;
  if (!publicId?.startsWith(managedPrefix)) return;

  try {
    const { cloudinary } = getCloudinary();
    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image",
    });
  } catch {
    // The database remains authoritative if remote cleanup is unavailable.
  }
}
