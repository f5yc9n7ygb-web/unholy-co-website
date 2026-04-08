"use client"

import { useRef, useEffect, useState, Suspense } from "react"
import { motion, useScroll, useTransform, useMotionValueEvent, transform } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"
import { CountUp } from "@/components/ux/CountUp"
import { PACKS } from "@/lib/shop/catalog"

/* ─── Lazy-load the heavy 3D scene ─── */
import dynamic from "next/dynamic"
const CinematicCanScene = dynamic(
  () =>
    import("@/components/3d/CinematicCanScene").then((m) => ({
      default: m.CinematicCanScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 animate-pulse rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(176,0,32,0.6) 0%, rgba(176,0,32,0.05) 70%)",
              boxShadow: "0 0 40px rgba(176,0,32,0.2)",
            }}
          />
          <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-bone/30">
            Loading
          </span>
        </div>
      </div>
    ),
  }
)

/* ─── Data ─── */

const specs = [
  { value: "500", unit: "ml", label: "Format" },
  { value: "11,000", unit: "ft", label: "Elevation" },
  { value: "4", unit: "minerals", label: "Profile" },
  { value: "0", unit: "% plastic", label: "Packaging" },
]

const minerals = [
  {
    symbol: "Ca",
    name: "Calcium",
    desc: "Bone density, nerve function, the thing your body handles quietly while you're busy overthinking everything else.",
  },
  {
    symbol: "Mg",
    name: "Magnesium",
    desc: "Muscle recovery, stress regulation. Nature's off switch — the one that actually works.",
  },
  {
    symbol: "K",
    name: "Potassium",
    desc: "Electrolyte balance, blood pressure. The reason your body doesn't stage a full revolt after the third encore.",
  },
  {
    symbol: "HCO\u2083",
    name: "Bicarbonates",
    desc: "Natural alkalinity. Clean, smooth finish — mineral water's signature without the wellness lecture.",
  },
]

/* ─── Scroll-synced text overlay ─── */

function ScrollText({
  children,
  enterAt,
  exitAt,
  scrollProgress,
  className = "",
  align = "right",
  startVisible = false,
  persist = false,
  isMobile = false,
}: {
  children: React.ReactNode
  enterAt: number
  exitAt: number
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"]
  className?: string
  align?: "left" | "right" | "center"
  startVisible?: boolean
  persist?: boolean
  isMobile?: boolean
}) {
  // Function-based useTransform forces JS-driven updates, bypassing
  // framer-motion 12's WAAPI ScrollTimeline optimization which breaks in Chrome.
  const opacity = useTransform(scrollProgress, (v) => {
    if (startVisible) return transform(v, [exitAt - 0.03, exitAt], [1, 0])
    if (persist) return transform(v, [enterAt, enterAt + 0.02], [0, 1])
    return transform(v, [enterAt, enterAt + 0.02, exitAt - 0.02, exitAt], [0, 1, 1, 0])
  })

  const y = useTransform(scrollProgress, (v) => {
    if (startVisible) return transform(v, [exitAt - 0.03, exitAt], [0, -30])
    if (persist) return transform(v, [enterAt, enterAt + 0.03], [40, 0])
    return transform(v, [enterAt, enterAt + 0.03, exitAt - 0.03, exitAt], [40, 0, 0, -30])
  })

  // On mobile: all text goes to bottom center, full width
  const effectiveAlign = isMobile ? "center" : align

  const positionClass = isMobile
    ? "inset-x-0 px-6 text-center"
    : effectiveAlign === "right"
      ? "right-4 md:right-8 lg:right-16 w-[42%] min-w-[260px] max-w-md"
      : effectiveAlign === "left"
        ? "left-4 md:left-8 lg:left-16 w-[42%] min-w-[260px] max-w-md"
        : "left-1/2 -translate-x-1/2 max-w-2xl text-center"

  // Mobile: position text in the bottom portion (below the canvas area);
  // Desktop: vertically centered (text overlays the full-screen canvas via z-index)
  const verticalClass = isMobile
    ? "bottom-[10%]"
    : "top-1/2 -translate-y-1/2"

  return (
    <motion.div
      className={`pointer-events-none absolute z-20 ${verticalClass} ${positionClass} ${className}`}
      style={{ opacity, y }}
    >
      {!isMobile && effectiveAlign !== "center" && (
        <div className="absolute -inset-6 -z-10 rounded-2xl bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      )}
      {/* Mobile dark gradient behind text for readability over the can */}
      {isMobile && (
        <div className="absolute -inset-x-4 -inset-y-6 -z-10 rounded-2xl bg-gradient-to-t from-black/80 via-black/60 to-transparent" />
      )}
      {children}
    </motion.div>
  )
}

/* ─── Loading pulse ─── */

function CanvasLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="h-10 w-10 animate-pulse rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(176,0,32,0.8) 0%, rgba(176,0,32,0.1) 70%)",
          boxShadow: "0 0 30px rgba(176,0,32,0.4)",
        }}
      />
    </div>
  )
}

/* ═══ Main Component ═══ */

export function BloodThirstClient() {
  /* Master scroll container ref — the tall element that drives everything */
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  /* Mutable ref that the 3D scene reads every frame (no re-renders) */
  const progressRef = useRef(0)
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progressRef.current = v
  })

  /* 3D mounted state */
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  /* Mobile detection — 768px breakpoint matches md: */
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  /* Atmospheric blood glow — intensifies with scroll */
  const glowOpacity = useTransform(scrollYProgress, (v) => transform(v, [0, 0.5, 1], [0.03, 0.08, 0.15]))
  const vignetteOpacity = useTransform(scrollYProgress, (v) => transform(v, [0, 0.3], [0.8, 0.4]))

  return (
    <>
      {/* ═══ THE SCROLL CONTAINER — this is the "tall" element ═══
          600vh gives us room for all the cinematic beats */}
      <div ref={containerRef} className="relative h-[600vh]">

        {/* ── Sticky viewport: 3D canvas + text overlays ── */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">

          {/* Atmospheric background layers */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(176,0,32,0.15)_0%,transparent_70%)]"
            style={{ opacity: glowOpacity }}
          />
          <motion.div
            className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,black_100%)]"
            style={{ opacity: vignetteOpacity }}
          />

          {/* 3D Canvas — full-screen on both mobile and desktop.
              On mobile, a dark gradient scrim at the bottom covers the text zone. */}
          <div className="absolute inset-0 z-10">
            {mounted ? (
              <Suspense fallback={<CanvasLoader />}>
                <CinematicCanScene scrollProgress={progressRef} isMobile={isMobile} />
              </Suspense>
            ) : (
              <CanvasLoader />
            )}
          </div>

          {/* ── Text overlays synced to scroll ── */}

          {/* Mobile bottom gradient scrim — darkens lower third so text overlays are readable */}
          {isMobile && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[42%]"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 50%, transparent 100%)",
              }}
            />
          )}

          {/* Act 0: Title card — fades IN after the mystery close-up reveals the can */}
          <motion.div
            className={`pointer-events-none absolute inset-x-0 z-20 mx-auto w-full max-w-3xl text-center px-8 ${
              isMobile ? "top-[8%]" : "top-[15%]"
            }`}
            style={{
              opacity: useTransform(scrollYProgress, (v) => transform(v, [0.08, 0.11, 0.15, 0.18], [0, 1, 1, 0])),
              y: useTransform(scrollYProgress, (v) => transform(v, [0.08, 0.11, 0.15, 0.18], [30, 0, 0, -30])),
            }}
          >
            <p className="mb-3 text-[9px] uppercase tracking-[0.5em] text-bone/25 md:text-[10px]">
              UNHOLY CO.
            </p>
            <h1 className="font-cinzel text-3xl font-bold uppercase tracking-[0.08em] text-offwhite sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              BloodThirst
            </h1>
            <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-bone/40 md:text-xs">
              Natural mineral water armored in obsidian-black aluminum
            </p>
          </motion.div>

          {/* Act 1: The Elixir — can on RIGHT, text on LEFT */}
          <ScrollText
            scrollProgress={scrollYProgress}
            enterAt={0.18}
            exitAt={0.32}
            align="left"
            isMobile={isMobile}
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-blood/60">
              The Elixir
            </p>
            <p className="text-sm leading-relaxed text-bone/70 md:text-lg lg:text-xl">
              BloodThirst is not just water. It never claimed to be. Natural mineral
              water from Himalayan volcanic geology at 11,000 feet — sealed in matte
              obsidian-black aluminum, because the contents finally warrant the
              packaging.
            </p>
          </ScrollText>

          {/* Act 2: The Source — can on LEFT, text on RIGHT */}
          <ScrollText
            scrollProgress={scrollYProgress}
            enterAt={0.39}
            exitAt={0.50}
            align="right"
            isMobile={isMobile}
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-blood/60">
              The Source
            </p>
            <p className="text-sm leading-relaxed text-bone/70 md:text-lg lg:text-xl">
              The Himalayas took 50 million years to form. The water had time to get
              interesting — filtered through ancient volcanic rock, picking up calcium,
              magnesium, potassium, and bicarbonates along the way.
              Nature&apos;s own mineral formula.
            </p>
          </ScrollText>

          {/* Act 3: The Profile — camera orbits, text on right */}
          <ScrollText
            scrollProgress={scrollYProgress}
            enterAt={0.54}
            exitAt={0.63}
            align="right"
            isMobile={isMobile}
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-blood/60">
              The Profile
            </p>
            <div className="grid grid-cols-2 gap-4">
              {minerals.map((m) => (
                <div key={m.symbol} className="border-l border-blood/20 pl-3">
                  <span className="font-cinzel text-2xl font-black text-blood/40">
                    {m.symbol}
                  </span>
                  <p className="mt-1 text-xs text-bone/50">{m.name}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-bone/40">
              We didn&apos;t add anything. Nature was already showing off.
            </p>
          </ScrollText>

          {/* Act 4: The Stand — can on RIGHT, text on LEFT */}
          <ScrollText
            scrollProgress={scrollYProgress}
            enterAt={0.67}
            exitAt={0.78}
            align="left"
            isMobile={isMobile}
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-blood/60">
              The Stand
            </p>
            <p className="text-sm leading-relaxed text-bone/70 md:text-lg lg:text-xl">
              Zero plastic, because the planet has enough problems. Zero compromise,
              because frankly so do you. Sealed in recycled aluminum for backstage
              riders, midnight creatives, and everyone who quietly decided that
              &apos;whatever&apos;s in the fridge&apos; stopped being enough.
            </p>
          </ScrollText>

          {/* Act 5: CTA — can left with scale punch, text right */}
          <ScrollText
            scrollProgress={scrollYProgress}
            enterAt={0.82}
            exitAt={1.0}
            persist
            align="right"
            isMobile={isMobile}
          >
            <h2 className="font-cinzel text-3xl font-bold text-offwhite md:text-4xl lg:text-5xl xl:text-6xl">
              Begin the ritual.
            </h2>
            <div className={`pointer-events-auto mt-8 flex flex-col gap-4 ${isMobile ? "items-center" : "items-start"}`}>
              <TransitionLink
                href="/shop"
                className="btn btn-primary px-10 py-3.5 text-sm"
              >
                Shop Now
              </TransitionLink>
              <TransitionLink
                href="/bloodverse"
                className="text-xs uppercase tracking-[0.3em] text-bone/30 transition-colors hover:text-blood/60"
              >
                or explore the Bloodverse
              </TransitionLink>
            </div>
          </ScrollText>

          {/* Scroll indicator — fades out as user scrolls */}
          <motion.div
            className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2"
            style={{
              opacity: useTransform(scrollYProgress, (v) => transform(v, [0, 0.03], [1, 0])),
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-[9px] uppercase tracking-[0.4em] text-bone/30">
                Scroll
              </span>
              <div className="h-8 w-px bg-gradient-to-b from-blood/40 to-transparent animate-pulse" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══ BELOW THE FOLD — Traditional sections after the cinematic experience ═══ */}

      {/* Specs */}
      <section className="relative overflow-hidden bg-black py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-4">
          <div className="h-px bg-blood/10" />
          <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-4 md:gap-12 md:py-20">
            {specs.map((spec) => (
              <div key={spec.label} className="text-center">
                <div className="flex items-baseline justify-center gap-1.5">
                  <CountUp
                    value={spec.value}
                    className="font-cinzel text-4xl font-bold text-blood md:text-5xl lg:text-6xl"
                  />
                  <span className="text-[10px] uppercase tracking-wider text-bone/30 md:text-xs">
                    {spec.unit}
                  </span>
                </div>
                <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-bone/40 md:text-xs">
                  {spec.label}
                </p>
              </div>
            ))}
          </div>
          <div className="h-px bg-blood/10" />
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative overflow-hidden bg-black py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center text-[10px] uppercase tracking-[0.5em] text-bone/30 md:mb-16 md:text-xs"
          >
            What they&apos;re saying
          </motion.p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            {[
              {
                quote: "The most unnecessarily cool water brand I\u2019ve ever seen. And it actually tastes incredible.",
                author: "Midnight creative",
                detail: "Mumbai",
              },
              {
                quote: "I bought it for the can. I stayed for the water. Now I keep buying it for both.",
                author: "Weekend warrior",
                detail: "Delhi",
              },
              {
                quote: "Finally, water that doesn\u2019t pretend to be healthy. It just is. The skull helps.",
                author: "True believer",
                detail: "Bangalore",
              },
            ].map((t, i) => (
              <motion.blockquote
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative rounded-xl border border-white/[0.04] bg-[#080808] p-8"
              >
                <span className="absolute -top-3 left-6 font-cinzel text-4xl font-black text-blood/20">
                  &ldquo;
                </span>
                <p className="text-sm leading-relaxed text-bone/60 md:text-base">
                  {t.quote}
                </p>
                <footer className="mt-5 flex items-center gap-3">
                  <div className="h-px w-6 bg-blood/30" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-offwhite/70">
                      {t.author}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-bone/30">
                      {t.detail}
                    </p>
                  </div>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Pack Selector */}
      <section className="relative overflow-hidden bg-black py-24 md:py-32">
        {/* Atmospheric glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 40% at 50% 30%, rgba(176,0,32,0.06), transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 text-center md:mb-16"
          >
            <p className="mb-3 text-[10px] uppercase tracking-[0.5em] text-bone/30 md:text-xs">
              Choose your ritual
            </p>
            <h2 className="font-cinzel text-3xl font-bold text-offwhite md:text-4xl lg:text-5xl">
              Claim your supply.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5">
            {PACKS.map((pack, i) => {
              const isFeatured = !!pack.tag
              return (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border p-7 transition-all duration-300 hover:border-blood/30 ${
                    isFeatured
                      ? "border-blood/20 bg-[#0a0608]"
                      : "border-white/[0.05] bg-[#080808]"
                  }`}
                >
                  {/* Featured tag */}
                  {pack.tag && (
                    <span className="absolute right-4 top-4 rounded-full border border-blood/30 bg-blood/10 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.25em] text-blood">
                      {pack.tag}
                    </span>
                  )}

                  {/* Large decorative number */}
                  <span className="pointer-events-none select-none font-cinzel text-6xl font-black text-offwhite/[0.03]">
                    {`0${i + 1}`}
                  </span>

                  <h3 className="mt-2 font-cinzel text-xl font-bold uppercase tracking-wide text-offwhite">
                    {pack.title}
                  </h3>
                  <p className="mt-1 text-xs text-bone/40">
                    {pack.qty} &times; BloodThirst 500ml
                  </p>

                  <div className="my-5 h-px bg-white/[0.05]" />

                  <p className="text-sm leading-relaxed text-bone/50">
                    {pack.blurb}
                  </p>

                  <div className="mt-auto pt-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-cinzel text-3xl font-black text-offwhite">
                        ₹{pack.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-bone/30">
                      ₹{pack.perCan}/can
                    </p>
                  </div>

                  <TransitionLink
                    href="/shop"
                    className={`mt-5 block w-full rounded-lg py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
                      isFeatured
                        ? "bg-blood text-offwhite hover:bg-[#8a0019] hover:text-white"
                        : "border border-white/[0.08] bg-white/[0.03] text-bone/60 hover:border-blood/30 hover:bg-blood/10 hover:text-offwhite"
                    }`}
                  >
                    Select Pack
                  </TransitionLink>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
