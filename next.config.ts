import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL,
  },

  // Development only. Chunk names are not content-hashed in dev, so a browser
  // that caches one keeps serving an old build at the same URL: an ordinary
  // reload replays stale code while a hard reload fetches the new one, which
  // reads as a bug in whatever that code happened to do.
  ...(process.env.NODE_ENV === "development"
    ? {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
