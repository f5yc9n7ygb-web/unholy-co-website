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

type OpenNextContext = {
  env: {
    UNHOLY_KV?: KVNamespace
  }
  ctx?: { waitUntil(p: Promise<unknown>): void }
}

async function getOpenNextContext(): Promise<OpenNextContext | null> {
  try {
    const mod = await import("@opennextjs/cloudflare")
    return (await mod.getCloudflareContext({ async: true })) as unknown as OpenNextContext
  } catch {
    return null
  }
}

/**
 * Get the Cloudflare `ExecutionContext` so we can call `waitUntil()` to run
 * background work after the response is returned. Returns null on local dev.
 */
export async function getExecutionContext(): Promise<{ waitUntil(p: Promise<unknown>): void } | null> {
  const context = await getOpenNextContext()
  return context?.ctx ?? null
}

/**
 * Attempt to retrieve the `UNHOLY_KV` namespace from the Cloudflare runtime.
 * Returns `null` when running outside Pages (local dev, Node tests, etc.).
 */
export async function getKVNamespace(): Promise<KVNamespace | null> {
  const context = await getOpenNextContext()
  return context?.env.UNHOLY_KV ?? null
}
