import { Marquee } from "@/components/ux/Marquee"
import { HOME_LEDGER } from "@/content/home2026"

/**
 * The single surviving marquee — restyled as an archival ledger strip. The old
 * homepage ran three marquees; 2026 keeps one, quiet, as a section divider.
 */
export function LedgerStrip() {
  return (
    <div className="relative z-10 overflow-hidden border-y border-bone/10 bg-black/40 py-3.5">
      <Marquee speed={32} pauseOnHover={false}>
        {HOME_LEDGER.map((text) => (
          <span key={text} className="mx-6 flex shrink-0 items-center gap-8">
            <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.32em] text-bone/40 md:text-[10px]">
              {text}
            </span>
            <span aria-hidden className="font-mono text-[9px] text-blood/50">
              /
            </span>
          </span>
        ))}
      </Marquee>
    </div>
  )
}
