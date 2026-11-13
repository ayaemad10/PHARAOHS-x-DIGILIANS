/** @type {import('next').NextConfig} */

/*
 * Long browser cache for the static media and data in /public. 30 days, then the browser re-checks in
 * the background (stale-while-revalidate), so a redeploy that changes a file still reaches returning
 * visitors without them waiting. Files built by Next.js (/_next/static) already get a one-year cache.
 */
const LONG_CACHE = [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=604800" }];

const nextConfig = {
  // Hides the development-only Next.js indicator (the "N" badge). It does not appear in production.
  devIndicators: false,
  async headers() {
    return [
      { source: "/media/:path*", headers: LONG_CACHE },
      { source: "/data/:path*", headers: LONG_CACHE },
      { source: "/team/:path*", headers: LONG_CACHE },
      { source: "/brand/:path*", headers: LONG_CACHE },
    ];
  },
};

export default nextConfig;
