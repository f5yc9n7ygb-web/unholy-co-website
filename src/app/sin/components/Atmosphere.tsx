/**
 * Fixed atmosphere stack for the "Black Room" — film grain + vignette over the
 * near-black velvet. Makes the matte surface read as a real material instead of
 * a flat fill, for essentially zero cost: one repeating SVG-noise tile and two
 * gradients, all GPU-composited, no JS, no animation.
 *
 * Rendered once behind everything in SinClient (above the base #070707 fill and
 * the existing top spotlight, below the page content).
 */

// Inline fractal-noise tile — tiny, cached as part of the HTML, no extra request.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function Atmosphere() {
  return (
    <>
      {/* Vignette — pulls the edges into shadow so the centre reads as lit. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(130% 100% at 50% 38%, transparent 52%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      {/* Film grain — soft-light blend keeps it a texture, never visible specks. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: GRAIN,
          backgroundRepeat: "repeat",
          opacity: 0.05,
          mixBlendMode: "soft-light",
        }}
      />
    </>
  )
}
