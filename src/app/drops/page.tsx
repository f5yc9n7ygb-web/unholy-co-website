import drops from "@/content/drops.json"
import { MicroHero } from "@/components/layout/MicroHero"
import { Countdown } from "@/components/shared/Countdown"
import Reveal from "@/components/ux/Reveal"
import { SubscribeForm } from "@/components/forms/SubscribeForm"

export const metadata = {
  title: "Drops — UNHOLY CO.",
  description: "Limited-edition BloodThirst runs, collabs, and ritual-only flavors. Reserve yours before the coven drinks them dry."
}

/**
 * The "Drops" page, which showcases limited-edition product releases.
 * This component displays a list of current and upcoming drops,
 * complete with countdown timers and notification forms.
 *
 * @returns {JSX.Element} The rendered drops page.
 */
export default function DropsPage() {
  return (
    <div className="section">
      <div className="container space-y-12">
        <MicroHero
          eyebrow="LIMITED RUNS"
          title="Every drop is a ritual."
          description="When the sigil glows, something rare is coming. Claim your slot, unlock lore, and stay ahead of the believers."
          actions={[
            { label: "Shop core packs", href: "/shop", variant: "ghost" },
            { label: "Read the Bloodverse", href: "/bloodverse", variant: "ghost" },
          ]}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {drops.map((drop) => (
            <Reveal key={drop.id}>
              <article className="glass-panel space-y-5">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-bone/60">
                  <span>{drop.status ?? "Limited"}</span>
                  <span>{drop.date}</span>
                </div>
                <h3 className="text-xl font-semibold text-offwhite">{drop.title}</h3>
                <p className="text-sm text-offwhite/70">{drop.blurb}</p>
                <div className="rounded-2xl border border-ash/40 bg-ash/20 px-4 py-3 text-sm text-offwhite/70">
                  <Countdown target={drop.date} />
                </div>

                {drop.notify ? (
                  <SubscribeForm
                    source={`drop_${drop.id}`}
                    buttonLabel="Notify me"
                    placeholder="you@domain"
                    formClassName="flex flex-col gap-3 sm:flex-row sm:items-center"
                    inputClassName="flex-1 rounded-xl border border-ash bg-ash/40 px-3 py-2 text-sm text-offwhite outline-none transition focus:border-blood focus:ring-2 focus:ring-blood/40"
                    buttonClassName="btn btn-primary w-full sm:w-auto"
                    statusClassName="text-xs text-offwhite/60"
                    successMessage="You’re on the list for this drop."
                  />
                ) : (
                  <p className="text-xs uppercase tracking-[0.3em] text-blood/80">Drop closed</p>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  )
}
