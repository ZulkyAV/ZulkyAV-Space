import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZulkyAV Space",
    short_name: "ZAV Space",
    description: "Projects, notes, experiments, and small ventures by ZulkyAV.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0B0B0F",
    theme_color: "#0B0B0F",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/zav-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/zav-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/zav-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
