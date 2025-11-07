import { copyFileSync, existsSync, renameSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const buildDir = join(root, '.open-next')
const workerSrc = join(buildDir, 'worker.js')
const workerDest = join(buildDir, '_worker.js')

if (existsSync(workerSrc)) {
  renameSync(workerSrc, workerDest)
  console.log('➜ Renamed worker.js → _worker.js for Cloudflare Pages')
} else if (!existsSync(workerDest)) {
  console.warn('⚠️  No worker.js found inside .open-next. Cloudflare Pages needs _worker.js')
}

const routesSrc = join(root, 'cf-pages-routes.json')
const routesDest = join(buildDir, '_routes.json')

if (existsSync(routesSrc)) {
  copyFileSync(routesSrc, routesDest)
  console.log('➜ Copied cf-pages-routes.json → .open-next/_routes.json')
} else {
  console.warn('⚠️  No cf-pages-routes.json found; skipping routes copy')
}

// Ensure assets are available at the expected public paths (flatten build-id folder)
const assetsDir = join(buildDir, 'assets')
const buildIdFile = join(assetsDir, 'BUILD_ID')
const staticDir = join(assetsDir, '_next', 'static')

try {
  if (existsSync(buildIdFile) && existsSync(staticDir)) {
    const buildId = readFileSync(buildIdFile, 'utf8').trim()
    const buildIdDir = join(staticDir, buildId)
    if (existsSync(buildIdDir)) {
      // Move files from static/<BUILD_ID>/* -> static/* so Pages asset keys match requests like /_next/static/css/...
      const entries = readdirSync(buildIdDir)
      for (const entry of entries) {
        const src = join(buildIdDir, entry)
        const dest = join(staticDir, entry)
        try {
          // rename (move). If dest exists, overwrite by removing dest first.
          if (existsSync(dest)) rmSync(dest, { recursive: true, force: true })
          renameSync(src, dest)
        } catch (err) {
          console.warn('⚠️  Failed to move asset', src, '→', dest, err)
        }
      }
      // Remove now-empty buildIdDir
      try { rmSync(buildIdDir, { recursive: true, force: true }) } catch (err) {}
      console.log(`➜ Flattened BUILD_ID assets (${buildId}) into .open-next/assets/_next/static`)
    }
  }
} catch (err) {
  console.warn('⚠️  Error while flattening BUILD_ID assets', err)
}
