import type { NextConfig } from "next";

// Sent with every page: no framing by other sites (clickjacking), no MIME sniffing, forms may only post
// back to this site, and the browser features the site never uses are switched off.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Keeps other sites' windows and pages from reaching into this one or embedding its files.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // Vercel adds "Access-Control-Allow-Origin: *" by default; nothing here is meant for other sites to read.
  { key: "Access-Control-Allow-Origin", value: "https://www.infinitysoma.co.za" },
];

const nextConfig: NextConfig = {
  // Hide the Next.js "N" dev-tools badge (development only; it overlaps the dashboard sidebar).
  devIndicators: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Staff pages hold client details: browsers and proxies must not keep copies.
      { source: "/dashboard/:path*", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] },
      { source: "/dashboard", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
