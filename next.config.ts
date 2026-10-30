import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The admin console is the self-contained SPA in public/console.html. Serve it
  // at /admin so the whole console (operations + referrals + payouts) lives at
  // one URL. The console authenticates itself (Supabase sign-in), so /admin is
  // intentionally NOT gated by proxy.ts.
  async rewrites() {
    return [{ source: "/admin", destination: "/console.html" }];
  },
};

export default nextConfig;
