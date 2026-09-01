import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Project Peak — 12 Week Home Workout",
    short_name: "Project Peak",
    description: "A 48-session home workout system for knowledge, habits and measurable progress.",
    start_url: "/mm/app",
    display: "standalone",
    background_color: "#f2f2ec",
    theme_color: "#06111a",
    icons: [
      { src: "/brand/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/maskable-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
