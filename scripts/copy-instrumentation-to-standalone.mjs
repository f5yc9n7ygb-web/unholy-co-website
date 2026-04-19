#!/usr/bin/env node

/**
 * @file Copies Next.js instrumentation artifacts into the standalone output.
 *
 * Next 16's `output: 'standalone'` mode emits `instrumentation.js.nft.json`
 * (the file-tracing manifest) into `.next/standalone/.next/server/` but does
 * NOT copy the actual `instrumentation.js` file alongside it. OpenNext's
 * Cloudflare bundler reads the `.nft.json`, fails to locate the referenced
 * `instrumentation.js`, and aborts the build with:
 *
 *   Error: File server/instrumentation.js does not exist
 *
 * This script closes that gap by copying `instrumentation.js`, its sourcemap,
 * and the `instrumentation/` directory from `.next/server/` (where Next does
 * emit them) into `.next/standalone/.next/server/`. It is a no-op when the
 * source files are absent, so projects without instrumentation are unaffected.
 *
 * Run between `next build` and `opennextjs-cloudflare build --skipNextBuild`.
 */

import { promises as fs } from "node:fs"
import path from "node:path"

const srcDir = path.join(".next", "server")
const destDir = path.join(".next", "standalone", ".next", "server")

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  await Promise.all(
    entries.map(async (entry) => {
      const s = path.join(src, entry.name)
      const d = path.join(dest, entry.name)
      if (entry.isDirectory()) await copyDir(s, d)
      else await fs.copyFile(s, d)
    }),
  )
}

async function copyIfPresent(relPath) {
  const src = path.join(srcDir, relPath)
  const dest = path.join(destDir, relPath)
  if (!(await exists(src))) return false
  const stat = await fs.stat(src)
  await fs.mkdir(path.dirname(dest), { recursive: true })
  if (stat.isDirectory()) {
    await copyDir(src, dest)
  } else {
    await fs.copyFile(src, dest)
  }
  return true
}

if (!(await exists(destDir))) {
  console.log("ℹ️  No standalone output found — skipping instrumentation copy.")
  process.exit(0)
}

const targets = ["instrumentation.js", "instrumentation.js.map", "instrumentation"]
const copied = []
for (const t of targets) {
  if (await copyIfPresent(t)) copied.push(t)
}

if (copied.length === 0) {
  console.log("ℹ️  No instrumentation artifacts to copy.")
} else {
  console.log(`✅ Copied to standalone: ${copied.join(", ")}`)
}
