/**
 * BloodThirst /buy — conversion-first landing copy.
 *
 * ART DIRECTION: "the cursed document." The page reads as a batch intake
 * file from the Records Division — stamps, file numbers, ruled ledgers,
 * redactions. Section labels follow the file metaphor, but every section
 * still answers a buyer question first. Clarity outranks lore here;
 * /bloodthirst-shop owns the mythology.
 */

/** Document chrome — recurring file artifacts around the page */
export const FILE_CHROME = {
  form: "FORM BT-001 — INTAKE",
  fileNo: "FILE № 001/2026",
  division: "UNHOLY BEVERAGES PVT. LTD. — RECORDS DIVISION",
  marginalia: "FILE BT/001/2026 · DO NOT DUPLICATE · DRINK COLD",
  endOfFile: "END OF FILE — BT/001",
  barcodeCaption: "8 901234 000013 · DO NOT SCAN",
} as const

export const BUY_HERO = {
  stamp: "BATCH 001 · FIRST RUN",
  headline: ["STILL WATER.", "DEAD SERIOUS."],
  subjectLabel: "SUBJECT",
  subject:
    "500ml Himalayan natural mineral water in a matte-black aluminium can. Still, not sparkling. The water is innocent. The can is not.",
  cta: "GET THE CANS",
  ctaMeta: "₹1,200 for 6 · from ₹169/can · 30-second checkout",
  verifiedLabel: "VERIFIED",
  trust: [
    "FSSAI licensed",
    "Razorpay secure",
    "Ships in 24–48 hrs",
    "Free India delivery",
  ],
} as const

/** Static index strip — replaces the marquee. One entry stays redacted. */
export const BUY_INDEX = {
  label: "INDEX",
  items: ["STILL, NOT SPARKLING", "0 SUGAR", "0 CAFFEINE", "0 PLASTIC", "500 ML"],
  redacted: "PANEL 3",
} as const

export const BUY_ANSWERS = {
  section: "01",
  title: "Intake questions",
  items: [
    {
      q: "What is it?",
      a: "Natural mineral water from the Himalayas. Still, not sparkling. pH 7.18, clean mineral profile, tastes like cold clarity. The best water you've had — wearing the worst intentions.",
    },
    {
      q: "Why a can?",
      a: "Aluminium chills faster, recycles forever, and never sheds microplastics into your bloodstream. Plastic bottles fail at all three. Also — look at it.",
    },
    {
      q: "Why “BloodThirst”?",
      a: "Because hydration is boring and you're not. Batch 001 is a first run: part collectible, part flex, all genuinely good water.",
    },
  ],
} as const

export const BUY_PANEL = {
  section: "02",
  title: "Acquisition",
  subtitle: "Pick your poison. It's water.",
  ctaPending: "SEALING",
  ctaFinePrint: "Razorpay secure · UPI · Cards · Net banking",
  priceNote: "Incl. all taxes · Free delivery across India",
  promoToggle: "Have a code?",
  afterPay: [
    "Packed and handed to the courier within 24–48 hours.",
    "Tracking lands in your inbox. Delivery in 3–7 business days.",
    "Damaged or leaking? Send photos within 48 hours of delivery — we make it right.",
  ],
  trust: ["Razorpay-secured", "GST invoice", "Tracked dispatch", "No hidden fees"],
} as const

export const BUY_VERSUS = {
  section: "03",
  title: "Comparative findings",
  stamp: "EXHIBIT A",
  question: "₹169 for water?",
  answer: "No. ₹169 for the last water you'll ever photograph.",
  usLabel: "BLOODTHIRST",
  themLabel: "SAD PLASTIC BOTTLE",
  rows: [
    {
      label: "Vessel",
      us: "Matte-black aluminium. Recyclable forever.",
      them: "Plastic. Slowly becoming part of you.",
    },
    {
      label: "Cold",
      us: "Chills in minutes. Stays cold.",
      them: "Lukewarm is its natural state.",
    },
    {
      label: "Microplastics",
      us: "Zero.",
      them: "~240,000 fragments per litre*",
    },
    {
      label: "On your desk",
      us: "A statement.",
      them: "Clutter.",
    },
    {
      label: "Afterlife",
      us: "Back on a shelf as a new can in ~60 days.",
      them: "Landfill. See you in 450 years.",
    },
  ],
  footnote:
    "*Nanoplastics in bottled water — PNAS, 2024. We read the study so you don't have to.",
  cta: "DRINK THE GOOD ONE",
} as const

export const BUY_COLLECTIBLE = {
  note: "Batch 001 cans don't get reprinted. When this run sells out, the design retires with it.",
} as const

export const BUY_STREET = {
  section: "04",
  title: "Witness statements",
} as const

export const BUY_FAQ = {
  section: "05",
  title: "Interrogation",
  items: [
    {
      q: "Still or sparkling?",
      a: "Still. Flat. Calm. The only thing sparkling here is the attitude.",
    },
    {
      q: "Is it actually good water?",
      a: "pH 7.18, TDS 256.87 mg/L, calcium 28.05 mg/L, taste officially rated “agreeable.” FSSAI licence 12725999000701. The name is the costume — the liquid is clean.",
    },
    {
      q: "When does it ship?",
      a: "Courier handoff within 24–48 hours of payment. Delivery takes another 3–7 business days anywhere in India. Tracking goes straight to your inbox.",
    },
    {
      q: "What if it arrives damaged?",
      a: "Send photos within 48 hours of delivery and we sort it — replacement or refund. Cans are tougher than bottles, but couriers are couriers.",
    },
    {
      q: "Why should I trust a brand called Unholy?",
      a: "FSSAI-licensed, Razorpay-secured, GST-invoiced. We're registered with every authority we plan to disappoint.",
    },
  ],
} as const

export const BUY_FINAL = {
  line: "The feed will refill. Batch 001 won't.",
  cta: "CLAIM BATCH 001",
} as const
