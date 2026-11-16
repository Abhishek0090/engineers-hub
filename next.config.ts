import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The content JSON is read from disk at runtime (see src/lib/data/json-repository.ts),
  // so make sure it is traced into the production server output.
  outputFileTracingIncludes: {
    "/**": ["./src/content/**/*.json"],
  },
  // PWA: the service worker must never be cached by the browser, or updates would not reach
  // installed apps. Basic security headers for every route.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
