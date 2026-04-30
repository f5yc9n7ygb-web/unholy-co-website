/**
 * BloodThirst — single-page ritual copy.
 *
 * All copy in one file so the brand voice can be tuned without code edits.
 * Voice rules: short, lethal, self-aware. Never explain. Never justify price.
 */

export const TAGLINES = [
  "Still Water. Dead Serious.",
  "Cause Your Liver Already Hates You.",
] as const

/** Phase 1 — Arrival */
export const ARRIVAL = {
  /** Letter-by-letter primary tagline */
  tagline: "STILL WATER. DEAD SERIOUS.",
  /** Smaller line that fades in after the tagline lands */
  subline: "500ml. No apology.",
  /** Top-left batch tag */
  batch: "BATCH 001 — IN CIRCULATION",
} as const

/** Phase 2 — Descent. Each card snaps to focus as the camera examines a face of the can. */
export const DESCENT_CARDS = [
  {
    eyebrow: "01 — SOURCE",
    line: "Purified. Cursed. 500ml.",
    body: "Himalayan mineral water, drawn from a spring nobody publishes the coordinates for.",
  },
  {
    eyebrow: "02 — TYPO",
    line: "The typo on panel 3 is intentional. Most people don't catch it.",
    body: "The ones who do don't tell us. They tell each other.",
  },
  {
    eyebrow: "03 — RUNES",
    line: "Runic symbols sourced from nowhere you'd recognize.",
    body: "Don't translate them. The translations get worse.",
  },
] as const

/** Damnation Facts — appears as part of the descent close-up. Feels like a nutrition label. */
export const DAMNATION_FACTS = {
  title: "DAMNATION FACTS",
  serving: "Per 500ml serving · Adult human (1)",
  rows: [
    { label: "VOLUME", value: "500 ml" },
    { label: "SOURCE", value: "Himalayan, depth unrecorded" },
    { label: "MINERALS", value: "Calcium · Magnesium · Resentment" },
    { label: "SUGAR", value: "0 g" },
    { label: "PLASTIC", value: "0 g" },
    { label: "RUNES", value: "Untranslated. Don't." },
    { label: "TYPO", value: "Panel 3. Intentional." },
    { label: "WARNING", value: "Hydration may cause clarity." },
  ],
  footer: "Manufactured in low light. Inspected by people who don't smile.",
} as const

/** Phase 3 — Proof. Reframed testimonials. No 5-star ratings. */
export const PROOF_LINES = [
  {
    quote: "I don't know what's in it but I ordered four more.",
    attr: "— A repeat offender",
  },
  {
    quote: "It's water. It's also a flex.",
    attr: "— Bombay",
  },
  {
    quote: "My therapist says it's a phase. I told her it's a subscription.",
    attr: "— Anonymous",
  },
  {
    quote: "Bought it for the can. Stayed for the dread.",
    attr: "— A collector",
  },
  {
    quote: "Tastes like a decision I'd make again.",
    attr: "— Delhi",
  },
  {
    quote: "Cheaper than therapy. Heavier than gold.",
    attr: "— A founder",
  },
] as const

/** Phase 4 — The Offer. Manifesto + product copy. */
export const OFFER = {
  eyebrow: "THE OFFER",
  manifesto: [
    "Most water is hydration.",
    "This is a position.",
  ],
  manifestoBody:
    "We didn't make a healthier water. We made a water that respects the kind of person who already knows the difference. Cold-forged. Cursed-cased. Sold by the pack to people who don't read disclaimers.",
  /** Final, curt argument before the product card */
  closer: "Buy something else. Or don't.",
  /** CTA verb on the button */
  cta: "SIGN",
  ctaPending: "SEALING",
  /** Tiny line under the CTA */
  ctaFinePrint: "Razorpay · UPI · Card · Net Banking",
  /** Trust strip below the product */
  trust: [
    "Razorpay-secured",
    "Tracked dispatch",
    "Cold-pack ship",
    "Free across India",
  ],
} as const

/** Phase 5 — Close. After Razorpay verifies. */
export const CLOSE = {
  stamp: "MARKED",
  welcome: "WELCOME, MARKED.",
  body: "Your name is on the list nobody publishes. We'll move the cans before the week ends.",
  cta: "VIEW RECEIPT",
  /** Trust seals shown in gothic style */
  seals: [
    { label: "ORDER", sub: "Sealed in record" },
    { label: "DISPATCH", sub: "48–72 hrs" },
    { label: "TRACKING", sub: "Sent to your inbox" },
  ],
} as const

/** Footer-y closing line at very bottom of the page */
export const FOOTNOTE =
  "BloodThirst — a product of UNHOLY CO. Drink it cold. Don't read panel 3 too carefully."
