import path from "node:path";
import type { NextConfig } from "next";

const api = new URL(process.env.API_URL ?? "http://localhost:8000/api/v1");
const site = new URL(process.env.SITE_ORIGIN ?? "https://redesign-home-karigar.vercel.app");
const pattern = (u: URL, pathname: string) => ({
  protocol: u.protocol.replace(":", "") as "http" | "https",
  hostname: u.hostname,
  port: u.port,
  pathname,
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: path.join(__dirname) },
  outputFileTracingRoot: path.join(__dirname),
  images: {
    qualities: [75, 85],
    // Uploaded photos come from the API's /media; photos the website already ships come from the website.
    remotePatterns: [pattern(api, "/media/**"), pattern(site, "/images/**")],
    // Next 16 refuses to optimise images from local addresses; allow it only while the API runs on this machine.
    dangerouslyAllowLocalIP: ["localhost", "127.0.0.1"].includes(api.hostname),
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    // As on the website: the persistent dev cache served stale server renders after edits (hydration mismatches).
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
