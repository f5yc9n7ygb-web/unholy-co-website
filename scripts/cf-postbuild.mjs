import { promises as fs } from "node:fs";
import path from "node:path";

const outDir = ".open-next";
await fs.mkdir(outDir, { recursive: true });

// Let the worker handle everything EXCEPT static assets
const routes = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/_next/*",
    "/assets/*",
    "/favicon.ico",
    "/static/*",
    "/.well-known/*",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.json",
    "/can.png"      // your image in /public
  ],
};
await fs.writeFile(path.join(outDir, "_routes.json"), JSON.stringify(routes, null, 2));

// Worker shim (keep as-is)
const shim = `
import worker from "./worker.js";
export default {
  async fetch(request, env, ctx) {
    return worker.fetch(request, env, ctx);
  }
};
`;
await fs.writeFile(path.join(outDir, "_worker.js"), shim, "utf8");

console.log("✅ wrote .open-next/_routes.json and .open-next/_worker.js");