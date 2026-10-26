import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 es un módulo nativo: no debe ser empaquetado por el bundler de Next
  serverExternalPackages: ["better-sqlite3"],
  images: {
    formats: ["image/webp"],
  },
};

export default nextConfig;
