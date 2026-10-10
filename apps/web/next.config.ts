import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Foundation uses per-request locale + API fetches; enable Cache Components later.
  cacheComponents: false,
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
