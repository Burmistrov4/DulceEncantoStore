import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/store";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const products = getProducts({ onlyActive: true });

  return [
    { url: site, changeFrequency: "daily", priority: 1 },
    ...products.map((p) => ({
      url: `${site}/producto/${p.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
