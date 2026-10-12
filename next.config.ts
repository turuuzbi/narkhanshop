import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
  },
  // Demo mode on Vercel builds its SQLite database from these files at startup (src/lib/demo-db.ts).
  outputFileTracingIncludes: {
    "/*": ["./prisma/migrations/**/*.sql"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
