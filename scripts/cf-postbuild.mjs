// Ensure Pages routes are correct so JS/CSS don't 404.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = ".open-next/routes";
mkdirSync(dir, { recursive: true });

const routes = {
  version: 1,
  // Let static assets be served directly by Pages (no Worker)
  exclude: [
    "/assets/*",
    "/_next/static/*",
    "/favicon.ico",
    "/favicon-*.png",
    "/manifest.webmanifest",
    "/icons/*",
    "/images/*",
    "/robots.txt",
    "/sitemap.xml"
  ],
  // Everything else goes through the Worker/functions bundle
  include: ["/*"]
};

writeFileSync(join(dir, "_routes.json"), JSON.stringify(routes, null, 2));
console.log("✅ Wrote .open-next/routes/_routes.json");