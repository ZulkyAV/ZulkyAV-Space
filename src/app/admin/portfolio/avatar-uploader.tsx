"use client";

import { useRef, useState } from "react";

type SignatureResponse = {
  apiKey: string;
  cloudName: string;
  folder: string;
  signature: string;
  timestamp: number;
  error?: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
};

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

export function AvatarUploader({
  initialUrl,
  initialPublicId,
}: {
  initialUrl: string | null;
  initialPublicId: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialUrl ?? "");
  const [avatarPublicId, setAvatarPublicId] = useState(
    initialPublicId ?? "",
  );
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadAvatar(file: File) {
    if (!allowedTypes.has(file.type)) {
      setMessage("Use a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > maxFileSize) {
      setMessage("The image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const signatureResponse = await fetch(
        "/api/admin/cloudinary/signature",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );

      const signatureData =
        (await signatureResponse.json()) as SignatureResponse;

      if (!signatureResponse.ok) {
        throw new Error(signatureData.error || "Could not authorize upload.");
      }

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", signatureData.apiKey);
      uploadData.append("timestamp", String(signatureData.timestamp));
      uploadData.append("signature", signatureData.signature);
      uploadData.append("folder", signatureData.folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signatureData.cloudName)}/image/upload`,
        {
          method: "POST",
          body: uploadData,
        },
      );

      const result =
        (await uploadResponse.json()) as CloudinaryUploadResponse;

      if (!uploadResponse.ok || !result.secure_url || !result.public_id) {
        throw new Error(result.error?.message || "Cloudinary upload failed.");
      }

      setAvatarUrl(result.secure_url);
      setAvatarPublicId(result.public_id);
      setMessage("Avatar uploaded. Save the portfolio to publish it.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Avatar upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-neutral-700">Profile avatar</p>

      <input type="hidden" name="avatarUrl" value={avatarUrl} />
      <input type="hidden" name="avatarPublicId" value={avatarPublicId} />

      <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 sm:flex-row sm:items-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar preview"
            className="h-24 w-24 rounded-2xl border border-neutral-200 bg-white object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-400">
            No image
          </div>
        )}

        <div className="flex-1">
          <p className="text-sm leading-6 text-neutral-500">
            JPG, PNG, or WebP. Maximum file size 5 MB.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-xl bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading..." : avatarUrl ? "Replace image" : "Upload image"}
            </button>

            {avatarUrl ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  setAvatarUrl("");
                  setAvatarPublicId("");
                  setMessage("Avatar removed. Save the portfolio to apply it.");
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-error-300 hover:text-error-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove
              </button>
            ) : null}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadAvatar(file);
            }}
          />

          {message ? (
            <p className="mt-3 text-xs leading-5 text-neutral-600" role="status">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
