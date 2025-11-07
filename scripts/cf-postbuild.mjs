import { copyFileSync, existsSync, renameSync } from 'node:fs'
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
