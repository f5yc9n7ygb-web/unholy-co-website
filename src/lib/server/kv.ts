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
