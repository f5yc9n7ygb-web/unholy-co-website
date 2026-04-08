/**
 * Cloudflare KV binding helper.
 *
 * On Cloudflare Pages, the KV namespace is exposed via the platform context.
 * In local development (next dev) the binding doesn't exist, so every caller
 * that receives `null` should fall back to an in-memory implementation.
 */

export type KVNamespace = {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

/**
 * Get the Cloudflare `ExecutionContext` so we can call `waitUntil()` to run
 * background work after the response is returned. Returns null on local dev.
 */
export async function getExecutionContext(): Promise<{ waitUntil(p: Promise<unknown>): void } | null> {
  try {
    // @ts-ignore — resolved at runtime on Cloudflare Pages
    const mod = await import("@cloudflare/next-on-pages")
    const ctx = mod.getRequestContext()
    return ctx.ctx ?? null
  } catch {
    return null
  }
}

/**
 * Attempt to retrieve the `UNHOLY_KV` namespace from the Cloudflare runtime.
 * Returns `null` when running outside Pages (local dev, Node tests, etc.).
 */
export async function getKVNamespace(): Promise<KVNamespace | null> {
  try {
    // @ts-ignore — resolved at runtime on Cloudflare Pages; peer-dep conflict prevents local install
    const mod = await import("@cloudflare/next-on-pages")
    const ctx = mod.getRequestContext()
    const kv = (ctx.env as Record<string, unknown>)["UNHOLY_KV"] as KVNamespace | undefined
    return kv ?? null
  } catch {
    // Expected in local dev — the package isn't loaded.
    return null
  }
}
