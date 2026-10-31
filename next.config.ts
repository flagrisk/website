import type { NextConfig } from "next";

// Secret path the admin console is served at. Set ADMIN_CONSOLE_PATH in Vercel
// to a long random slug; the "admin" fallback is only for local development.
// Trim whitespace (a pasted value often carries a trailing space/newline) and
// strip any leading/trailing slashes so the rewrite source matches cleanly.
const ADMIN_CONSOLE_PATH = (process.env.ADMIN_CONSOLE_PATH || "admin")
  .trim()
  .replace(/^\/+|\/+$/g, "")
  .trim();

// Shows up in the Vercel build log without revealing the slug, so a stray
// character (wrong length) is easy to spot.
console.log(
  `[next.config] admin console path resolved (length ${ADMIN_CONSOLE_PATH.length})`,
);

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
  // The admin console is the self-contained SPA in public/console.html. It is
  // served ONLY at a secret, hard-to-guess path set in the ADMIN_CONSOLE_PATH
  // env var (configured in Vercel, never committed). The raw /console.html URL
  // is bounced so the secret path is the only way in, and the page is marked
  // noindex so it never shows up in search. The console authenticates itself
  // (Supabase sign-in + web_is_admin), so the secret path is not gated by
  // proxy.ts.
  async rewrites() {
    return {
      beforeFiles: [
        { source: `/${ADMIN_CONSOLE_PATH}`, destination: "/console.html" },
        // Marketing site: the design pages are served as isolated static HTML
        // (public/*.html) so they render exactly as designed, independent of the
        // app's React/Tailwind styles. The functional app routes (signup, login,
        // checkout, dashboard) are unchanged.
        { source: "/", destination: "/home.html" },
        { source: "/what-we-do", destination: "/what-we-do.html" },
        { source: "/about", destination: "/about.html" },
        { source: "/stories", destination: "/stories.html" },
        { source: "/pricing", destination: "/pricing.html" },
        { source: "/privacy", destination: "/privacy.html" },
        { source: "/terms", destination: "/terms.html" },
        { source: "/delete-account", destination: "/delete-account.html" },
        { source: "/contact", destination: "/contact.html" },
        { source: "/stories/set-up-your-circle", destination: "/story-set-up-your-circle.html" },
        { source: "/stories/first-60-seconds", destination: "/story-first-60-seconds.html" },
        { source: "/stories/late-night-journeys", destination: "/story-late-night-journeys.html" },
        { source: "/stories/a-circle-that-showed-up", destination: "/story-a-circle-that-showed-up.html" },
        { source: "/stories/student-circle", destination: "/story-student-circle.html" },
        { source: "/stories/know-your-area", destination: "/story-know-your-area.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    // Direct hits on the static file are sent away; redirects run before the
    // filesystem, while the secret rewrite above resolves the file without
    // re-checking redirects, so the console stays reachable only via the slug.
    return [{ source: "/console.html", destination: "/", permanent: false }];
  },
  async headers() {
    // Keep the console out of search engines even if the slug is ever found.
    const robots = { key: "X-Robots-Tag", value: "noindex, nofollow" };
    return [
      { source: "/console.html", headers: [robots] },
      { source: `/${ADMIN_CONSOLE_PATH}`, headers: [robots] },
    ];
  },
};

export default nextConfig;
