// scripts/cf-postbuild.mjs
import { promises as fs } from "node:fs";
import path from "node:path";

const outDir = ".open-next";
await fs.mkdir(outDir, { recursive: true });

// Route EVERYTHING to the worker (keep it minimal for now)
const routes = { version: 1, include: ["/*"], exclude: [] };
await fs.writeFile(path.join(outDir, "_routes.json"),
  JSON.stringify(routes, null, 2), "utf8");

// Forward fetch explicitly to the OpenNext worker
const shim = `
import worker from "./worker.js";
export default {
  async fetch(request, env, ctx) {
    return worker.fetch(request, env, ctx);
  }
};
`;
await fs.writeFile(path.join(outDir, "_worker.js"), shim, "utf8");

// Optional: drop a health file so we can verify static asset serving
await fs.writeFile(path.join(outDir, "health.txt"), "ok\n", "utf8");

console.log("✅ Wrote .open-next/_routes.json, .open-next/_worker.js, and health.txt");