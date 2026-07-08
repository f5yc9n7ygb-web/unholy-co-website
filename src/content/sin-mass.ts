/**
 * /sin — "THE RED MASS" copy. Full replacement voice for the Black Room.
 *
 * Art direction: hype-drop brutalism. Full-bleed black/blood slabs, poster
 * type, sticker-stamps, tickers. The page SHOUTS — but the claims stay
 * defensible and the checkout spine stays sober.
 *
 * Copy-claim guardrails (confirmed 2026-06-23, do not violate):
 *  - Microplastics claims stay COMPARATIVE ("not a plastic bottle shedding…"),
 *    never absolute "zero" (cans carry an internal liner).
 *  - ~60-day can-recycling claim keeps its Aluminum Association / CMI citation.
 *  - No stock or sales counters anywhere. No fake ratings. Field notes are
 *    brand voice, not customer quotes.
 *
 * Copy ONLY — every price/qty figure derives from PACKS in catalog.ts at the
 * component level.
 */

export const MASS_HERO = {
  stamp: "BATCH 001 · FIRST PRESSING",
  /** Stacked poster headline — one word per slab line. */
  headline: ["DRINK", "LIKE YOU", "MEAN IT."],
  sub: "Himalayan still water. Matte-black can. 500ml of cold, licensed menace.",
  cta: "BUY THE CAN",
  /** Rotated price sticker; numbers injected live from the entry pack. */
  priceLabel: "FROM",
  trust: ["FSSAI LICENSED", "RAZORPAY SECURE", "FREE SHIPPING · INDIA", "DISPATCH 24–84H"],
} as const

/** Infinite ticker seams. Rendered twice for the loop — keep items short. */
export const MASS_TICKER = [
  "STILL WATER",
  "MATTE BLACK CAN",
  "0 SUGAR",
  "0 CAFFEINE",
  "pH 7.18",
  "500 ML",
  "STAY UNHOLY",
] as const

export const MASS_OBJECT = {
  stamp: "EXHIBIT",
  title: "THE OBJECT",
  sub: "Looks like trouble. Behaves like water.",
  shots: [
    { src: "/bloodthirst-hero.webp", pos: "50% 42%", scale: 1, cap: "THE CAN", note: "500ml matte-black aluminium" },
    { src: "/can-gallery.webp", pos: "50% 34%", scale: 2.2, cap: "THE MARK", note: "blackletter + one drip of blood" },
    // pos targets the DAMNATION FACTS panel (top-right quadrant of the label
    // art) — vertical centre ~12% keeps the parody table in frame instead of
    // the manufacturing block beneath it.
    { src: "/bloodthirst-texture-gallery.webp", pos: "92% 0%", scale: 2.3, cap: "THE FACTS", note: "damnation facts. read them." },
    { src: "/can-gallery.webp", pos: "50% 2%", scale: 2.4, cap: "THE SEAL", note: "crack it · stay unholy" },
  ],
  stats: [
    { big: "7.18", small: "pH — COLD CLARITY" },
    { big: "500", small: "ML — SERVES ONE" },
    { big: "0", small: "SUGAR · CAFFEINE · APOLOGIES" },
  ],
} as const

export const MASS_BUY = {
  stamp: "THE DROP",
  title: "PICK YOUR POISON",
  sub: "It's water. You'll still want all of it.",
  rowCta: "SELECTED",
  /** /sin-only sticker labels layered over catalog tags — every row earns one.
   * Keys are pack ids; falls back to the catalog `tag` when absent. */
  tagOverrides: {
    pack24: "BULK BLASPHEMY",
  } as Record<string, string>,
  cta: "BUY NOW",
  ctaPending: "SEALING",
  ctaConnecting: "OPENING SECURE CHECKOUT",
  ctaRetry: "CHECKOUT UNAVAILABLE · TAP TO RETRY",
  finePrint: "Razorpay secure · UPI · GPay · Cards · Netbanking",
  priceNote: "All taxes in. Shipping free. No games.",
  /** One quiet line that plants the order-bump BEFORE checkout — the note
   * itself stays inside the sheet where it's itemized and removable. */
  addOnTease: "At checkout: add a handwritten Cursed Note (+\u20b999). We write it. They never recover.",
  /** Pincode serviceability check — personalises the generic 3\u20137 day promise.
   * Uses the existing /api/pincode/lookup; the ETA copy stays the honest range. */
  pinLabel: "DELIVERS TO YOU?",
  pinPlaceholder: "6-digit pincode",
  pinChecking: "CHECKING\u2026",
  /** %CITY% / %STATE% replaced live. */
  pinHit: "DELIVERS TO %CITY%, %STATE% \u2014 3\u20137 DAYS",
  pinMiss: "COULDN'T PLACE THAT PINCODE \u2014 WE STILL SHIP INDIA-WIDE, 3\u20137 DAYS",
  afterPay: [
    "Packed from warehouse stock — courier handoff usually inside 24–48h (up to 84h if ops misbehave).",
    "Tracking hits your inbox. Delivery 3–7 business days, India-wide, weather permitting.",
    "Arrives dented or leaking? Photos within 48 hours — replaced or refunded.",
  ],
} as const

export const MASS_PROOF = {
  stamp: "FIELD NOTES",
  title: "WHAT THE CAN DOES TO PEOPLE",
  sub: "Not reviews. Just the damage, documented.",
  notes: [
    { quote: "Came for the can. Reordered for the cold.", tag: "NOTE 01" },
    { quote: "It's water. It's also a flex.", tag: "NOTE 02" },
    { quote: "Bought it for the can. Stayed for the dread.", tag: "NOTE 03" },
    { quote: "Tastes like a decision I'd make again.", tag: "NOTE 04" },
    { quote: "My therapist says it's a phase. I told her it's a subscription.", tag: "NOTE 05" },
    { quote: "Minds its own business. Unlike your relatives.", tag: "NOTE 06" },
  ],
  strip: ["FSSAI LICENSED", "RAZORPAY SECURE", "SHIPS ACROSS INDIA", "TRACKED DISPATCH", "100% RECYCLABLE CAN"],
} as const

export const MASS_VERSUS = {
  stamp: "NO CONTEST",
  title: "CAN VS BOTTLE",
  usLabel: "BLOODTHIRST",
  themLabel: "PLASTIC BOTTLE",
  rows: [
    { label: "VESSEL", us: "Matte-black aluminium. Recyclable forever.", them: "Plastic. Slowly becoming part of you." },
    { label: "COLD", us: "Chills in minutes. Stays cold.", them: "Lukewarm is its natural state." },
    { label: "MICROPLASTICS", us: "Not a plastic bottle shedding into your water.", them: "~240,000 fragments per litre*" },
    { label: "ON YOUR DESK", us: "A statement.", them: "Clutter." },
    { label: "AFTERLIFE", us: "A new can in ~60 days.†", them: "Landfill. See you in 450 years." },
  ],
  footnote:
    "*Nanoplastics in bottled water — PNAS, 2024.  †Beverage can recycled to new can in under 60 days — The Aluminum Association & Can Manufacturers Institute. We read them so you don't have to.",
  cta: "DRINK THE GOOD ONE",
} as const

export const MASS_FAQ = {
  stamp: "STRAIGHT ANSWERS",
  title: "ASK. WE DARE YOU.",
  items: [
    {
      q: "STILL OR SPARKLING?",
      a: "Still. Flat. Calm. The only thing sparkling here is the attitude.",
    },
    {
      q: "IS THE WATER ACTUALLY GOOD?",
      a: "pH 7.18, TDS 256.87 mg/L, calcium 28.05 mg/L. FSSAI licence 12725999000701. The name is theatre — the water is clean and real.",
    },
    {
      q: "WHEN DOES IT SHIP?",
      a: "Courier handoff usually within 24–48 hours of payment; allow up to 84 hours if operations or tech misbehave. Delivery in 3–7 business days anywhere in India — logistics and weather permitting. Tracking goes straight to your inbox.",
    },
    {
      q: "WHAT IF IT ARRIVES DAMAGED?",
      a: "Send photos within 48 hours of delivery — replacement or refund. Cans are tougher than bottles, but couriers are couriers.",
    },
    {
      q: "WHY TRUST A BRAND CALLED UNHOLY?",
      a: "FSSAI-licensed, Razorpay-secured, GST-invoiced. We're registered with every authority we plan to disappoint.",
    },
  ],
} as const

export const MASS_VAULT = {
  stamp: "CLASSIFIED",
  title: "THE FORBIDDEN SHELF",
  sub: "Two things we probably shouldn't sell. Screenshot them. Tell no one.",
  items: [
    {
      kind: "blackglove" as const,
      file: "DROP X01",
      name: "THE BLACK GLOVE",
      status: "INVITATION ONLY",
      line: "Hand-delivered by the founder, in a black glove, because normal shipping lacks emotional damage. You don't apply. You get chosen.",
      note: "CONCIERGE TIER · ₹1,00,000",
      action: "REQUEST AN INVITATION",
    },
    {
      kind: "donotbuy" as const,
      file: "DROP X02",
      name: "DO NOT BUY",
      status: "FORBIDDEN",
      line: "666 cans and a signed crate. The one drop we're openly begging you to leave alone. You won't.",
      // %PRICE% replaced with the live SKU price in-component.
      note: "IF YOU'RE UNWELL ENOUGH · %PRICE%",
      action: "BUY IT ANYWAY",
    },
  ],
  ritualNote: "Want the full 3D ritual instead?",
  ritualCta: "Enter /bloodthirst-shop",
  ritualHref: "/bloodthirst-shop",
} as const

export const MASS_FINAL = {
  stamp: "LAST CALL",
  line: "THE FEED REFILLS. BATCH 001 DOESN'T.",
  cta: "CLAIM BATCH 001",
} as const


/**
 * WHY \u20b9X A CAN \u2014 the price-justification slab (sits right after the money;
 * catches the hesitator who scrolled past without buying). %PER_CAN% derives
 * from the currently selected pack. Claims stay inside the guardrails:
 * comparative microplastics only, recycling claim cited in MASS_VERSUS.
 */
export const MASS_WHY = {
  stamp: "THE MATH",
  title: "WHY %PER_CAN% A CAN",
  items: [
    {
      n: "01",
      head: "It earns its place on the table.",
      body: "Matte-black aluminium, blackletter mark, one drip of blood. People ask what it is before they ask for a sip. That's the point.",
    },
    {
      n: "02",
      head: "Genuinely, annoyingly good water.",
      body: "Himalayan natural mineral water. pH 7.18, TDS 256.87 mg/L, FSSAI-licensed. The name is the costume \u2014 the liquid is the real thing.",
    },
    {
      n: "03",
      head: "It isn't a plastic bottle.",
      body: "Chills faster, and it's not a plastic bottle shedding fragments into your water. The can comes back as a new can in ~60 days. A bottle takes 450 years.",
    },
  ],
} as const

/** Classified band after the proof wall \u2014 drives the deep scroll to the vault. */
export const MASS_TEASE = {
  tag: "CLASSIFIED",
  line: "There's a shelf we don't advertise.",
  cta: "OPEN THE FORBIDDEN SHELF",
} as const

/**
 * JOIN THE CULT \u2014 the second conversion path. Catches visitors who won't buy
 * today; posts to the existing double-opt-in /api/subscribe with source "sin".
 */
export const MASS_CULT = {
  stamp: "OR AT LEAST",
  title: "JOIN THE CULT",
  sub: "Drops, batches and bad decisions \u2014 straight to your inbox. No spam. We're unholy, not annoying.",
  placeholder: "you@midnight.com",
  cta: "SIGN ME UP",
  pending: "SUMMONING\u2026",
  success: "CHECK YOUR INBOX \u2014 CONFIRM THE PACT.",
  error: "THE RITUAL FAILED. TRY AGAIN.",
} as const

export const MASS_FOOTER = {
  links: [
    { label: "FAQ", href: "/faq" },
    { label: "TRACK", href: "/track" },
    { label: "REFUNDS", href: "/refund" },
    { label: "CONTACT", href: "/contact" },
  ],
  line: "UNHOLY CO. · STAY UNHOLY",
  endMark: "BT/001 · DRINK COLD",
} as const

/** Dispatch copy — honest, time-based urgency. NEVER a stock/sales count. */
export const MASS_DISPATCH = {
  cutoffHour: 16,
  beforeLabel: "TODAY'S DISPATCH",
  afterLabel: "NEXT DISPATCH — TOMORROW",
  beforePrefix: "ORDER IN",
  afterNote: "FIRST IN QUEUE",
} as const
