import type { NextConfig } from "next";

function apiImagePattern() {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: "/uploads/**" as const,
    };
  } catch {
    return {
      protocol: "http" as const,
      hostname: "localhost",
      port: "8080",
      pathname: "/uploads/**" as const,
    };
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  // Foundation uses per-request locale + API fetches; enable Cache Components later.
  cacheComponents: false,
  images: {
    // Next.js 16 blocks private IPs (localhost API uploads) unless allowed.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [apiImagePattern()],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
