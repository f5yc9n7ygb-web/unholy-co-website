/**
 * Copy for the 2026 homepage overhaul — "COLD LIGHT ARCHIVE".
 *
 * Direction: the matured /sin cold-light language (real photography, grain,
 * hairline rules, mono annotations, CSS-only motion) promoted to the front
 * door, fused with editorial/archival framing (case files, spec sheets,
 * specimen annotations). One marquee, no scroll-jacking, no glass panels.
 *
 * Claim guardrails (user-confirmed): microplastics stays COMPARATIVE (never
 * "zero" — cans carry an internal liner); no stock/sales counts anywhere;
 * water specs pH 7.18 / TDS 256.87 / Ca 28.05 / FSSAI 12725999000701 are
 * verified accurate and safe to print.
 */

export const HOME_HERO = {
  kicker: "UNHOLY CO. — NATURAL MINERAL WATER, CANNED",
  headline: ["BLOOD", "THIRST"] as const,
  subject:
    "Himalayan mineral water sealed in matte-black aluminum. No sugar, no flavoring, no apologies — water that spent long enough in ancient mountain rock to know exactly what it is.",
  ctaPrimary: "ENTER THE SHOP",
  ctaPrimaryHref: "/shop",
  ctaGhost: "READ THE LORE",
  ctaGhostHref: "/bloodverse",
  // Museum hairline callouts around the specimen (lg+ only, decorative —
  // the same facts repeat in THE RECORD, so the layer stays aria-hidden).
  annotations: [
    { label: "SOURCE ELEVATION", note: "11,000 FT — HIMALAYAN AQUIFER", side: "left", y: 26 },
    { label: "pH 7.18", note: "TDS 256.87 MG/L", side: "left", y: 56 },
    { label: "VESSEL", note: "MATTE-BLACK ALUMINUM · 500 ML", side: "right", y: 34 },
    { label: "SERVE", note: "2°C — COLDER THAN THE ROOM", side: "right", y: 64 },
  ] as const,
  trust: [
    "FSSAI LIC. 12725999000701",
    "0 SUGAR · 0 CAFFEINE",
    "STILL — NEVER SPARKLING",
    "FREE SHIPPING — INDIA",
  ] as const,
} as const

export const HOME_LEDGER = [
  "BLOODTHIRST",
  "BATCH 001",
  "HIMALAYAN SOURCE",
  "EST. MMXXV",
  "NOT YOUR SALVATION",
  "500 ML — STILL, NEVER SPARKLING",
  "UNHOLY CO.",
] as const

export const HOME_RECORD = {
  kicker: "FILE 01 — THE RECORD",
  title: "DAMNATION FACTS",
  intro:
    "Everything below is printed on the can and filed under the license beside it. Nothing added, nothing flavored, nothing to confess — and unlike a plastic bottle, the can won't shed into your water while it waits.",
  specs: [
    { label: "SOURCE", value: "HIMALAYAN AQUIFER — 11,000 FT" },
    { label: "pH", value: "7.18" },
    { label: "TDS", value: "256.87 MG/L" },
    { label: "CALCIUM", value: "28.05 MG/L" },
    { label: "SERVE TEMPERATURE", value: "2°C" },
    { label: "VESSEL", value: "MATTE-BLACK ALUMINUM · 500 ML" },
    { label: "LICENSE", value: "FSSAI 12725999000701" },
  ] as const,
  entries: [
    {
      num: "A",
      title: "FORGED IN DARKNESS",
      desc: "Himalayan mineral water from volcanic geology, sealed in cold matte-black aluminum. Designed for those who consider 'whatever's available' a personal insult.",
    },
    {
      num: "B",
      title: "ZERO COMPROMISE",
      desc: "No sugar. No flavoring. No artificial anything. Just water that spent long enough in ancient mountain rock to know exactly what it is. Nothing more. Try competing with that.",
    },
    {
      num: "C",
      title: "TASTE THE SIN",
      desc: "Every other drink in the room is overclaiming. BloodThirst isn't. Ice-cold minerals, zero sugar, zero performance. The most interesting thing you can drink is something honest.",
    },
  ] as const,
} as const

export const HOME_GALLERY = {
  kicker: "FILE 02 — THE EVIDENCE",
  title: "COLD LIGHT",
  // Treated crops of real assets — swap in fresh photography by editing here.
  shots: [
    {
      src: "/can-gallery.webp",
      pos: "50% 40%",
      scale: 1,
      cap: "THE SPECIMEN",
      note: "500 ml matte-black aluminum",
    },
    {
      src: "/bloodthirst-texture-gallery.webp",
      pos: "50% 30%",
      scale: 1.25,
      cap: "THE LABEL",
      note: "damnation facts, printed",
    },
    {
      src: "/bloodthirst-hero.webp",
      pos: "72% 60%",
      scale: 1.15,
      cap: "UNDER THE LAMP",
      note: "as served — 2°C",
    },
    {
      src: "/bloodthirst-texture-gallery.webp",
      pos: "18% 75%",
      scale: 1.7,
      cap: "THE MARK",
      note: "the reaper, on every can",
    },
  ] as const,
} as const

export const HOME_MANIFESTO = {
  lines: ["NOT", "FOR", "EVERYONE"] as const,
  stamp: "FORGED FOR THE FEW",
} as const

export const HOME_RITUAL = {
  kicker: "FILE 03 — THE PROCESS",
  title: "THE RITUAL",
  steps: [
    {
      num: "01",
      title: "SUMMON",
      desc: "Grip the cold aluminum. The condensation on matte black isn't aesthetic — it's temperature. 500ml of high-altitude mineral water. This is where the ritual starts.",
    },
    {
      num: "02",
      title: "BREAK THE SEAL",
      desc: "That hiss is ancient mountain pressure meeting your room for the first time. It happens once, and then it's yours. Don't waste it on distraction.",
    },
    {
      num: "03",
      title: "CONSUME THE SIN",
      desc: "Crisp. Mineral-sharp. Impossibly clean. This is what water tastes like when it's actually been somewhere. No sugar, no flavoring — nothing between you and the mountain.",
    },
    {
      num: "04",
      title: "LEAVE NO TRACE",
      desc: "Crush the can. Toss it in recycling. Walk away knowing you just hydrated better than 99% of the room — and you didn't need to announce it.",
    },
  ] as const,
  // Bottom of the funnel: a reader five sections deep is warm — the primary
  // action is the shop; the lore stays as a ghost link.
  cta: "ENTER THE SHOP",
  ctaHref: "/shop",
  ctaGhost: "OR READ THE BLOODVERSE",
  ctaGhostHref: "/bloodverse",
} as const

export const HOME_TRANSMISSION = {
  kicker: "JOIN THE CULT",
  title: "STAY UNHOLY",
  copy: "First access to drops, rituals, and everything we don't tell the ordinary.",
  verified: [
    "FSSAI LIC. 12725999000701",
    "HIMALAYAN SOURCE",
    "SECURE CHECKOUT — RAZORPAY",
    "SHIPS ACROSS INDIA",
  ] as const,
} as const
