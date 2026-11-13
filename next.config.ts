import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The content JSON is read from disk at runtime (see src/lib/data/json-repository.ts),
  // so make sure it is traced into the production server output.
  outputFileTracingIncludes: {
    "/**": ["./src/content/**/*.json"],
  },
};

export default nextConfig;
