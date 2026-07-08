/**
 * /sin — "THE BLACK ROOM" landing copy for BloodThirst.
 *
 * Art direction: a matte-black status object spotlit on near-black velvet —
 * a specimen under glass, not a paper file (/buy) and not a 3D ritual
 * (/bloodthirst-shop). Voice is confident, a little menacing, never loud.
 *
 * Copy ONLY. Every price, per-can figure and pack name is derived from
 * PACKS in src/lib/shop/catalog.ts at the component level — never hardcode
 * numbers here.
 */

/**
 * Pack ids currently available for the /sin funnel. Single and 3-can packs are
 * intentionally hidden until matching packaging is ready, so paid traffic never
 * sees an offer the team cannot fulfil.
 */
export const SIN_AVAILABLE_PACK_IDS = ["pack6", "pack12", "pack24"] as const

/**
 * Catalog id the page default-selects AND the hero price derives from. Keeping
 * it in one place guarantees the two can never disagree.
 */
export const SIN_ENTRY_PACK_ID = "pack6"

export const SIN_HERO = {
  kicker: "BLOODTHIRST · BATCH 001",
  /** Poster headline — one menacing line, broken for rhythm. */
  headline: ["DRINK", "IN COLD", "BLOOD."],
  subject:
    "500ml Himalayan still mineral water in a matte-black can. The water is innocent. The can has priors.",
  ctaPrimary: "ACQUIRE",
  trust: ["FSSAI LICENSED", "RAZORPAY SECURE", "FREE INDIA SHIPPING", "DISPATCH 24–84H"],
  /** Above-the-fold price chip framing (numbers injected from the available pack set). */
  chipLabel: "AVAILABLE NOW",
  chipNote: "Incl. all taxes · Free delivery",
  /**
   * Specimen annotations — museum-exhibit hairline callouts over the hero can
   * (lg+ only; the phone fold has no room). Claims must stay defensible: no
   * absolute "zero microplastics", no uncited numbers. `y` is % from the top of
   * the hero, tuned to the can's on-screen position.
   */
  annotations: [
    { y: 30, label: "MATTE-BLACK ALUMINIUM", note: "chills in minutes" },
    { y: 52, label: "ONE LINE OF BLOOD", note: "on purpose" },
    { y: 72, label: "500ML · STILL", note: "pH 7.18 · Himalayan" },
  ],
} as const

/** Thin spec seam under the hero — proof the water is real, fast to scan. */
export const SIN_SPECS = [
  "STILL — NEVER SPARKLING",
  "0 SUGAR",
  "0 CAFFEINE",
  "0 PLASTIC BOTTLE",
  "500 ML",
  "pH 7.18",
] as const

/**
 * Dispatch urgency — honest, time-based, and NEVER stock/sales counts. Inventory
 * is already manufactured and warehoused, so this must talk about courier
 * movement, not fresh sealing or production. `cutoffHour` is IST (24h); the
 * component renders a live countdown to it.
 */
export const SIN_DISPATCH = {
  cutoffHour: 16,
  beforeLabel: "TODAY'S DISPATCH WINDOW",
  afterLabel: "NEXT DISPATCH — TOMORROW",
  /** %T% replaced with a live H:MM:SS countdown in-component. */
  beforeNote: "Order in the next %T% to ship in today's courier run.",
  afterNote: "Today's courier window has closed. Order now to enter tomorrow's first dispatch queue.",
  /** Edition scarcity — the honest version of urgency for this page. */
  edition: "BATCH 001 · FIRST RUN",
  editionNote: "Batch 001 cans are already in the warehouse. When this batch sells out, this can retires.",
} as const

/**
 * The Exhibit — a product gallery built from the assets that exist today
 * (the can render + the unwrapped label art). Each shot is a CROP of a real
 * image; structured so true product photography drops straight in later by
 * swapping `src` / `pos`. Cold buyers convert on seeing the thing.
 */
export const SIN_EXHIBIT = {
  kicker: "THE SPECIMEN",
  title: "EXAMINE THE EVIDENCE",
  subtitle:
    "Matte-black aluminium. A blackletter mark. One line of blood. Photographed cold — look closely.",
  shots: [
    { src: "/bloodthirst-hero.webp", pos: "50% 42%", scale: 1, cap: "THE VESSEL", note: "500ml matte-black aluminium, rim-lit cold." },
    { src: "/can-gallery.webp", pos: "50% 44%", scale: 1.7, cap: "THE MARK", note: "Blackletter wordmark. One drip of blood, on purpose." },
    { src: "/bloodthirst-texture-gallery.webp", pos: "98% 50%", scale: 2.1, cap: "DAMNATION FACTS", note: "The back of the can tells the truth. Mostly." },
    { src: "/can-gallery.webp", pos: "50% 88%", scale: 1.9, cap: "THE SEAL", note: "Natural mineral water. An Unholy Co. creation." },
  ],
} as const

export const SIN_BUY = {
  kicker: "ACQUISITION",
  title: "CHOOSE YOUR DOSE",
  subtitle: "It's just water. You'll still want all of them.",
  packsNote: "Shipping-ready packs only.",
  ctaPending: "SEALING",
  ctaConnecting: "OPENING SECURE CHECKOUT",
  ctaRetry: "CHECKOUT UNAVAILABLE · TAP TO RETRY",
  ctaFinePrint: "Razorpay secure · UPI · Cards · Net banking",
  /** Sheet chrome — kills perceived effort before it starts. */
  sheetHint: "Two steps · no account · under a minute",
  /** Chip-rendered payment rails — recognisable marks beat a dot-separated line. */
  payMethodList: ["UPI", "GPay", "PhonePe", "Cards", "NetBanking"],
  /** Payment rails, spelled out where the money changes hands. */
  payMethods: "UPI · GPay · PhonePe · Cards · Netbanking",
  priceNote: "Incl. all taxes · Free delivery across India",
  gstToggle: "Need a GST invoice?",
  gstHint: "For business orders. We'll verify the GSTIN automatically.",
  promoToggle: "Have a code?",
  shippingLabel: "Where it haunts",
  afterPay: [
    "Packed from warehouse stock and usually handed to the courier within 24–48 hours; allow up to 84 hours if operations or tech misbehave.",
    "Tracking lands in your inbox — delivery in 3–7 business days (logistics and weather permitting).",
    "Arrives dented or leaking? Photos within 48 hours and we make it right.",
  ],
  trust: ["Razorpay-secured", "GST invoice on request", "Tracked dispatch", "No hidden fees"],
} as const

/**
 * Cursed Note — the ONE add-on surfaced on /sin (the Ledger stays vault-side;
 * its public-consent step is poor cold-checkout friction). It's the rare bit of
 * theater that earns money: cheap, impulsive, gift-shaped, and the "Send To Your
 * Ex" tone is tailor-made for cold IG. Title / price / tones are read from
 * CHECKOUT_ADD_ON_CONFIG at the component — only the seduction copy lives here.
 * Rendered COLLAPSED in checkout step 2 so it can never block the pay action.
 */
export const SIN_ADDON = {
  kicker: "BEFORE YOU SEAL IT",
  title: "Add a Cursed Note",
  blurb:
    "Handwritten by us, sealed inside your box. We'll write the thing you'd never admit you sent.",
  toneLabel: "Pick your poison",
  recipientLabel: "Who receives it",
  recipientPlaceholder: "Name of the sinner",
  contextLabel: "Give us something to work with",
  contextPlaceholder: "One detail. We'll make it personal.",
  addLabel: "Add the curse",
  addedLabel: "Curse added",
} as const

/**
 * Unholy Ledger — the SECOND checkout add-on on /sin (the user moved it here
 * from the vault). Title / price (₹666) / consent label are read from
 * CHECKOUT_ADD_ON_CONFIG at the component; only seduction copy lives here.
 * Rendered COLLAPSED in checkout step 2 below the Cursed Note. The public-record
 * consent step is the hook's own — it never enters the order without it.
 */
export const SIN_LEDGER_ADDON = {
  kicker: "OPTIONAL · ON THE RECORD",
  title: "Sign the Unholy Ledger",
  blurb:
    "Your name, your city, a confession — entered into the public record. Permanent. We publish it; you live with it.",
  nameLabel: "Display name or handle",
  namePlaceholder: "@unholy_sinner",
  cityLabel: "City",
  cityPlaceholder: "Jaipur",
  confessionLabel: "Confession (optional)",
  confessionPlaceholder: "I said I was just curious. I lied.",
  addLabel: "Sign the ledger",
  addedLabel: "Signed",
} as const

export const SIN_VALUE = {
  kicker: "THE CASE FILE",
  /** %PER_CAN% is replaced with the default pack's per-can figure in-component. */
  title: "WHY %PER_CAN% A CAN",
  items: [
    {
      tag: "01 · STATUS",
      head: "It earns its place on the table.",
      body: "Matte-black aluminium, blackletter mark, blood drip. People ask what it is before they ask for a sip. That's the whole point.",
    },
    {
      tag: "02 · THE WATER",
      head: "Genuinely, annoyingly good.",
      body: "Himalayan natural mineral water. pH 7.18, clean profile, tastes like cold clarity. The name is the costume — the liquid is FSSAI-licensed truth.",
    },
    {
      tag: "03 · NO PLASTIC",
      head: "It isn't a plastic bottle.",
      body: "The aluminium can body chills faster and is not a plastic bottle shedding bottle fragments into your water. The can comes back as a new can in as little as ~60 days — a plastic bottle takes 450 years.",
    },
  ],
} as const

export const SIN_VERSUS = {
  kicker: "EXHIBIT",
  title: "THE COMPARISON NOBODY ASKED FOR",
  usLabel: "BLOODTHIRST",
  themLabel: "SAD PLASTIC BOTTLE",
  rows: [
    { label: "Vessel", us: "Matte-black aluminium. Recyclable forever.", them: "Plastic bottle. Slowly becoming part of you." },
    { label: "Cold", us: "Chills in minutes. Stays cold.", them: "Lukewarm is its natural state." },
    { label: "Microplastics", us: "No plastic bottle shedding into your water.", them: "~240,000 fragments per litre*" },
    { label: "On your desk", us: "A statement.", them: "Clutter." },
    { label: "Afterlife", us: "A new can in ~60 days.†", them: "Landfill. See you in 450 years." },
  ],
  footnote: "*Nanoplastics in bottled water — PNAS, 2024.  †Beverage can recycled to new can in under 60 days — The Aluminum Association & Can Manufacturers Institute. We read them so you don't have to.",
  cta: "DRINK THE GOOD ONE",
} as const

/**
 * Brand field notes — deliberately not customer testimonials. These are
 * rating-free, voice-led lines that dramatize the buyer mindset without
 * pretending to quote real customers.
 */
export const SIN_PROOF = {
  kicker: "FIELD NOTES",
  title: "THINGS THE CAN MAKES PEOPLE SAY",
  subtitle: "Not reviews. Just the kind of damage the object does.",
  statements: [
    { quote: "Came for the can. Reordered for the cold.", attr: "FIELD NOTE 01" },
    { quote: "It's water. It's also a flex.", attr: "FIELD NOTE 02" },
    { quote: "Bought it for the can. Stayed for the dread.", attr: "FIELD NOTE 03" },
    { quote: "Tastes like a decision I'd make again.", attr: "FIELD NOTE 04" },
    { quote: "My therapist says it's a phase. I told her it's a subscription.", attr: "FIELD NOTE 05" },
  ],
  credibility: [
    "FSSAI LICENSED",
    "RAZORPAY SECURE",
    "SHIPS ACROSS INDIA",
    "TRACKED DISPATCH",
    "100% RECYCLABLE",
  ],
} as const

export const SIN_FAQ = {
  kicker: "INTERROGATION",
  title: "QUESTIONS UNDER THE LAMP",
  items: [
    {
      q: "Still or sparkling?",
      a: "Still. Flat. Calm. The only thing sparkling here is the attitude.",
    },
    {
      q: "Is it actually good water?",
      a: "pH 7.18, TDS 256.87 mg/L, calcium 28.05 mg/L. FSSAI licence 12725999000701. The name is theatre — the water is clean and real.",
    },
    {
      q: "When does it ship?",
      a: "Courier handoff usually happens within 24–48 hours of payment; allow up to 84 hours if operations or tech misbehave. Delivery then takes 3–7 business days anywhere in India — logistics and weather permitting. Tracking goes straight to your inbox.",
    },
    {
      q: "What if it arrives damaged?",
      a: "Send photos within 48 hours of delivery — replacement or refund. Cans are tougher than bottles, but couriers are couriers.",
    },
    {
      q: "Why trust a brand called Unholy?",
      a: "FSSAI-licensed, Razorpay-secured, GST-invoiced. We're registered with every authority we plan to disappoint.",
    },
  ],
} as const

export const SIN_FINAL = {
  kicker: "LAST CALL",
  line: "The feed refills every morning. Batch 001 doesn't.",
  cta: "CLAIM BATCH 001",
} as const

/**
 * Mid-page teaser — the "door" to the theater. Placed AFTER the offer + proof
 * (never above the fold, which is money real estate) and visually subordinate
 * to the real CTAs. Its CTA anchor-scrolls DOWN to the on-page vault — it does
 * NOT jump off-site, so it teases without leaking a cold buyer off the page.
 */
export const SIN_TEASER = {
  tag: "CLEARANCE — WATER ONLY",
  line: "You've seen the water. You haven't seen the rest.",
  body:
    "A glove that delivers by hand. A pack we're begging you not to buy. A ledger of public confessions. None of it is for first-timers.",
  cta: "PICK THE LOCK",
} as const

/**
 * Brand vault — the "room" behind the teaser, kept BELOW checkout and OFF the
 * cold buy path. These three are pure theater: built to be screenshotted and
 * reposted, not to convert. The off-site jump to the full ritual lives HERE, at
 * the bottom of the funnel, where leaking a deep-scroller is fine. (The Cursed
 * Note left this list — it's a real ₹99 buy, so it moved into checkout.)
 */
export const SIN_VAULT = {
  kicker: "RESTRICTED",
  title: "THE REST OF THE RECORD",
  blurb:
    "Past the water, there's a smaller, stranger collection. Screenshot it. Just don't say we invited you.",
  items: [
    {
      kind: "blackglove",
      file: "BT/001 · X01",
      name: "THE BLACK GLOVE",
      status: "BY INVITATION",
      line: "Hand-delivered by the founder, in a black glove, because normal shipping lacks emotional damage. You don't apply. You get chosen.",
      note: "Concierge tier · ₹1,00,000",
      action: "REQUEST AN INVITATION",
    },
    {
      kind: "donotbuy",
      file: "BT/001 · X02",
      name: "DO NOT BUY",
      status: "FORBIDDEN",
      line: "666 cans and a signed crate. The one pack we're openly begging you to leave alone. You won't.",
      // %PRICE% replaced with the live donotbuy SKU price in-component.
      note: "If you're unwell enough · %PRICE%",
      action: "BUY IT ANYWAY",
    },
  ],
  /** Soft discovery thread only — the full 3D ritual, for the genuinely curious.
   *  Subordinate to the on-page actions; the page no longer pushes buyers off. */
  ritualNote: "Prefer the full ritual, in 3D?",
  ritualCta: "Descend into /bloodthirst-shop",
  ritualHref: "/bloodthirst-shop",
} as const

export const SIN_FOOTER = {
  footnote: "UNHOLY CO. · STAY UNHOLY",
  endMark: "— BT/001 · DRINK COLD —",
} as const
