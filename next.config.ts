import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  async rewrites() {
    const api = (process.env.CINEMA_API_URL || "http://127.0.0.1:5005").replace(/\/$/, "")
    return [{ source: "/uploads/:path*", destination: `${api}/uploads/:path*` }]
  },
  partialPrefetching: true,
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
