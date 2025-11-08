import { promises as fs } from "node:fs";
import path from "node:path";

const outDir = ".open-next";

// OpenNext generates .open-next/worker.js automatically
// We just need to ensure _routes.json exists with the correct configuration
// for Cloudflare Pages to properly route static assets

// Check if OpenNext already created _routes.json
let routesExist = false;
try {
  await fs.access(path.join(outDir, "_routes.json"));
  routesExist = true;
  console.log("✅ _routes.json already exists from OpenNext");
} catch {
  // Create it if it doesn't exist
  const routes = {
    version: 1,
    include: ["/*"],
    exclude: [
      "/_next/*",         // All Next.js assets
      "/favicon.svg",     // Favicon
      "/og.png",          // OG image  
      "/Can.PNG",         // Case-sensitive: actual filename in public/
    ],
  };
  await fs.writeFile(path.join(outDir, "_routes.json"), JSON.stringify(routes, null, 2));
  console.log("✅ Created _routes.json");
}

// Check if worker.js exists (should be created by OpenNext)
try {
  await fs.access(path.join(outDir, "worker.js"));
  console.log("✅ worker.js exists from OpenNext build");
} catch {
  console.error("❌ worker.js not found - OpenNext build may have failed");
  process.exit(1);
}

console.log("✅ Post-build setup complete");