import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return (["mm", "en"] as const).flatMap((locale) => [
    { url: `${base}/${locale}`, changeFrequency: "monthly" as const, priority: 1 },
    { url: `${base}/${locale}/legal`, changeFrequency: "yearly" as const, priority: 0.25 },
  ]);
}
