import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @libsql/client tiene bindings nativos: no debe ser empaquetado por el bundler de Next
  serverExternalPackages: ["@libsql/client"],
  images: {
    formats: ["image/webp"],
    // Las fotos subidas al admin viven en Vercel Blob (URL remota) —
    // permitimos next/image para ese dominio
    remotePatterns: [{ protocol: "https", hostname: "**.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
