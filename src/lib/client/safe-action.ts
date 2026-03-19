export function resolveSafeAction(action: string | undefined, fallbackPath: string) {
  const target = action || fallbackPath

  try {
    const resolved = new URL(target, window.location.origin)
    if (resolved.origin !== window.location.origin) {
      throw new Error("Cross-origin form actions are not allowed.")
    }

    return `${resolved.pathname}${resolved.search}`
  } catch {
    throw new Error("Invalid form action.")
  }
}
