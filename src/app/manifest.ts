// Web app manifest (served at /manifest.webmanifest and linked automatically by Next.js).
// Name and description come from src/content/site.json.
import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/catalog";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/learn",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b0d17",
    theme_color: "#0b0d17",
    categories: ["education", "productivity"],
    icons: [
      { src: "/pwa-icon/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Continue learning", url: "/learn", icons: [{ src: "/pwa-icon/192.png", sizes: "192x192" }] },
      { name: "Review mistakes", url: "/review", icons: [{ src: "/pwa-icon/192.png", sizes: "192x192" }] },
      { name: "Question bank", url: "/interview", icons: [{ src: "/pwa-icon/192.png", sizes: "192x192" }] },
    ],
  };
}
