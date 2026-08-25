"use client";

import { useRef, useState } from "react";

type UploadScope = "project" | "product";

type SignatureResponse = {
  apiKey: string;
  cloudName: string;
  folder: string;
  signature: string;
  timestamp: number;
  error?: string;
};

type UploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
};

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function AdminImageUploader({
  scope,
  initialUrl = "",
  initialPublicId = "",
  urlFieldName = "imageUrl",
  publicIdFieldName = "imagePublicId",
  label = "Image",
}: {
  scope: UploadScope;
  initialUrl?: string | null;
  initialPublicId?: string | null;
  urlFieldName?: string;
  publicIdFieldName?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(initialUrl ?? "");
  const [publicId, setPublicId] = useState(initialPublicId ?? "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file: File) {
    if (!allowedTypes.has(file.type)) {
      setMessage("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("The image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const signatureResponse = await fetch("/api/admin/cloudinary/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const signature = (await signatureResponse.json()) as SignatureResponse;
      if (!signatureResponse.ok) {
        throw new Error(signature.error || "Could not authorize upload.");
      }

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", signature.apiKey);
      body.append("timestamp", String(signature.timestamp));
      body.append("signature", signature.signature);
      body.append("folder", signature.folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
        { method: "POST", body },
      );
      const result = (await response.json()) as UploadResponse;
      if (!response.ok || !result.secure_url || !result.public_id) {
        throw new Error(result.error?.message || "Cloudinary upload failed.");
      }

      setImageUrl(result.secure_url);
      setPublicId(result.public_id);
      setMessage("Image uploaded. Save this item to publish the change.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-[#101015] p-4">
      <input type="hidden" name={urlFieldName} value={imageUrl} />
      <input type="hidden" name={publicIdFieldName} value={publicId} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Upload preview"
            className="h-24 w-24 rounded-xl border border-white/10 bg-[#14141A] object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-white/10 bg-[#14141A] text-xs text-neutral-500">
            No image
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-neutral-300">{label}</p>
          <p className="text-xs text-neutral-400">JPG, PNG, or WebP · max 5 MB</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {uploading ? "Uploading..." : imageUrl ? "Replace image" : "Upload image"}
            </button>
            {imageUrl ? (
              <button
                type="button"
                onClick={() => {
                  setImageUrl("");
                  setPublicId("");
                  setMessage("Image removed. Save to apply.");
                }}
                className="rounded-lg border border-white/15 bg-[#14141A] px-4 py-2 text-sm font-semibold text-neutral-300"
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
              if (file) void upload(file);
            }}
          />
          {message ? <p className="mt-2 text-xs text-neutral-400">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
