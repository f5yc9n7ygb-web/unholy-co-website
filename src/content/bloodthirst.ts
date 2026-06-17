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
  subline: "Real water. Unreal packaging.",
  /** Top-left batch tag */
  batch: "BATCH 001 — FIRST RUN",
  /** Plain truth, because nobody should have to decode the liquid */
  commerce:
    "500ml natural mineral water · matte-black aluminium · 0 sugar · free India delivery · from ₹169/can",
  cta: "Claim Batch 001",
  trust: [
    "FSSAI licensed",
    "Razorpay secure",
    "Dispatch 24-48 hrs",
    "Free India delivery",
  ],
} as const

/** Phase 2 — Descent. Each card snaps to focus as the camera examines a face of the can. */
export const DESCENT_CARDS = [
  {
    eyebrow: "01 — SOURCE",
    line: "Purified. Cursed. 500ml.",
    body: "Himalayan mineral water with a clean mineral profile. The liquid behaves. The can does not.",
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

/**
 * Damnation Facts — appears as part of the descent close-up. Feels like a nutrition label.
 *
 * This panel is the IDENTITY statement (what it is / what it isn't). The verifiable
 * chemistry (pH, TDS, calcium, taste) lives in FAQ / report surfaces. Keep the
 * categorical zeros and the brand voice here so the shop doesn't read like a lab form.
 */
export const DAMNATION_FACTS = {
  title: "DAMNATION FACTS",
  serving: "Per 500ml serving · Adult human (1)",
  rows: [
    { label: "VOLUME", value: "500 ml" },
    { label: "TYPE", value: "Still natural mineral water" },
    { label: "SUGAR", value: "0 g" },
    { label: "CAFFEINE", value: "0 mg" },
    { label: "ALCOHOL", value: "0%" },
    { label: "FLAVOURING", value: "None added" },
    { label: "PLASTIC", value: "0 g" },
    { label: "WARNING", value: "Hydration may cause clarity." },
  ],
  footer:
    "Manufactured in low light. Inspected by people who don't smile. Report details live in the FAQ.",
} as const

/** Phase 3 — Proof. Reframed testimonials. No 5-star ratings. */
export const PROOF_LINES = [
  {
    quote: "Came for the can. Reordered for the cold.",
    attr: "— A repeat buyer",
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
  /** Self-aware kicker after the manifesto body — old "closer" relocated here. */
  manifestoKicker: "You clicked for the can. Claim it before the feed takes you back.",
  /** Final, curt argument before the product card */
  closer: "Batch 001. First run.",
  /** CTA verb on the button */
  cta: "PAY SECURELY",
  ctaPending: "SEALING",
  /** Tiny line under the CTA */
  ctaFinePrint: "Razorpay · UPI · Card · Net Banking",
  /** Trust strip below the product */
  trust: [
    "Razorpay-secured",
    "Tracked dispatch",
    "24–48 hrs dispatch",
    "Free across India",
  ],
} as const

/** The proof layer. Boring facts, dressed for the room. */
export const PROOF_LEDGER = {
  eyebrow: "THE BORING PROOF",
  title: "Don't be scared. It's just water.",
  body:
    "Still natural mineral water in a recyclable aluminium can. No added sugar, caffeine, alcohol, or flavouring. The name is the costume. The liquid is clean.",
  facts: [
    { label: "FSSAI", value: "12725999000701" },
    { label: "MARKETED BY", value: "Unholy Beverages Private Limited" },
    { label: "BEST BEFORE", value: "12 months from manufacture" },
    { label: "PAYMENT", value: "Prepaid only · Razorpay UPI / cards / netbanking" },
  ],
  report: [
    { label: "pH", value: "7.18" },
    { label: "TDS", value: "256.87 mg/L" },
    { label: "Calcium", value: "28.05 mg/L" },
    { label: "Taste / odor", value: "Agreeable" },
  ],
  afterSign: [
    "Packed for courier handoff within 24–48 hours.",
    "Delivery usually takes another 3–7 business days in India.",
    "Damage, leak, defect, or wrong item? Contact support within 48 hours of delivery with photos for review.",
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
    { label: "DISPATCH", sub: "24–48 hrs" },
    { label: "TRACKING", sub: "Sent to your inbox" },
  ],
} as const

/**
 * Capture hook — catches the visitor who isn't buying today.
 * Wired to /api/subscribe (double opt-in). Access first, offers when we choose.
 */
export const CAPTURE = {
  eyebrow: "Not buying today?",
  title: "The list nobody publishes.",
  body:
    "Batch 001 is a first run. The marked hear first — drops, restocks, strange transmissions.",
  placeholder: "your email",
  button: "GET MARKED",
  success: "Check your inbox. Confirm you're marked.",
  finePrint: "No spam. First access, private codes, and the drops worth opening.",
} as const

/** Footer-y closing line at very bottom of the page */
export const FOOTNOTE =
  "BloodThirst — a product of UNHOLY CO. Drink it cold. Don't read panel 3 too carefully."
