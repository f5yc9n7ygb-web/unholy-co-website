import Link from "next/link"

export const metadata = {
  title: "404 — Lost Soul",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Blood atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, rgba(176,0,32,0.14), transparent 70%)",
        }}
      />

      <div className="relative z-10 space-y-6 max-w-xl">
        {/* Eyebrow */}
        <span className="badge border-blood/40 bg-blood/10 text-bone/80 uppercase tracking-[0.35em]">
          Error 404
        </span>

        {/* 404 number */}
        <div
          className="font-cinzel font-black text-[22vw] md:text-[10rem] leading-none select-none"
          style={{
            color: "rgba(176,0,32,0.15)",
            textShadow: "0 0 80px rgba(176,0,32,0.25)",
          }}
          aria-hidden="true"
        >
          404
        </div>

        <h1 className="h1 -mt-4">Lost Soul</h1>

        <p className="p max-w-md mx-auto">
          This page wandered into the void. It did not return. The ritual you
          seek does not exist here — but the coven does.
        </p>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link href="/" className="btn btn-primary">
            Return to the altar
          </Link>
          <Link href="/shop" className="btn btn-ghost">
            Shop BloodThirst
          </Link>
        </div>
      </div>
    </div>
  )
}
