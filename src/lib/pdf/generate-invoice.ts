import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { getGstAmount, getBasePrice, GST_RATE } from "@/lib/shop/catalog"

export type InvoiceData = {
  orderId: string
  paymentId: string
  pack: string
  quantity: number
  /** GST-inclusive amount actually charged (after discount) */
  amount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress: string
  shippingCity?: string
  shippingState?: string
  shippingPincode?: string
  timestamp: string
  promoCode?: string
  /** Discount amount (already subtracted from `amount`) */
  discountAmount?: number
}

/* ─── Indian state name → GST state code ─── */
const STATE_CODES: Record<string, string> = {
  "andhra pradesh": "37", "arunachal pradesh": "12", "assam": "18",
  "bihar": "10", "chhattisgarh": "22", "goa": "30", "gujarat": "24",
  "haryana": "06", "himachal pradesh": "02", "jharkhand": "20",
  "karnataka": "29", "kerala": "32", "madhya pradesh": "23",
  "maharashtra": "27", "manipur": "14", "meghalaya": "17", "mizoram": "15",
  "nagaland": "13", "odisha": "21", "punjab": "03", "rajasthan": "08",
  "sikkim": "11", "tamil nadu": "33", "telangana": "36", "tripura": "16",
  "uttar pradesh": "09", "uttarakhand": "05", "west bengal": "19",
  "delhi": "07", "new delhi": "07",
  "andaman and nicobar islands": "35", "chandigarh": "04",
  "dadra and nagar haveli and daman and diu": "26",
  "jammu and kashmir": "01", "ladakh": "38",
  "lakshadweep": "31", "puducherry": "34",
}

function getStateCode(state: string): string {
  return STATE_CODES[state.toLowerCase().trim()] || ""
}

/** Supplier state — Delhi */
const SUPPLIER_STATE = "Delhi"
const SUPPLIER_STATE_CODE = "07"

/**
 * Generate a GST-compliant A4 tax invoice PDF.
 *
 * Mandatory fields per Rule 46 of CGST Rules 2017:
 * - Supplier name, address, GSTIN
 * - Sequential invoice number (unique per FY)
 * - Date of issue
 * - Recipient name, address, state name + code (for B2C > ₹50k or interstate)
 * - HSN code, description, quantity, unit, rate, taxable value
 * - CGST/SGST or IGST shown separately
 * - Place of supply with state name
 * - Total invoice value
 * - Reverse charge declaration (N/A for B2C but included for completeness)
 * - Signature / computer-generated disclaimer
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const {
    orderId, paymentId, pack, quantity, amount,
    customerName, customerEmail, customerPhone,
    shippingAddress, shippingCity, shippingState, shippingPincode,
    timestamp, promoCode, discountAmount,
  } = data

  const basePrice = getBasePrice(amount)
  const gstAmount = getGstAmount(amount)

  // Determine if interstate (IGST) or intra-state (CGST+SGST)
  const buyerStateCode = shippingState ? getStateCode(shippingState) : ""
  const isInterstate = buyerStateCode !== "" && buyerStateCode !== SUPPLIER_STATE_CODE

  // Original price before discount (for display)
  const originalAmount = discountAmount ? amount + discountAmount : amount
  const originalBasePrice = discountAmount ? getBasePrice(originalAmount) : basePrice

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595.28, 841.89]) // A4
  const { height } = page.getSize()

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const bloodRed = rgb(176 / 255, 0, 32 / 255)
  const black = rgb(0, 0, 0)
  const grey = rgb(0.4, 0.4, 0.4)
  const lineGrey = rgb(0.85, 0.85, 0.85)

  let y = height - 50
  const leftMargin = 50
  const rightEdge = 545

  // ── Header ──
  page.drawText("UNHOLY CO.", {
    x: leftMargin, y, size: 22, font: fontBold, color: bloodRed,
  })
  page.drawText("TAX INVOICE", {
    x: rightEdge - fontBold.widthOfTextAtSize("TAX INVOICE", 14),
    y: y + 4, size: 14, font: fontBold, color: black,
  })

  y -= 18
  page.drawText("Himalayan Natural Mineral Water for the Counterculture", {
    x: leftMargin, y, size: 8, font: fontRegular, color: grey,
  })

  // Separator
  y -= 16
  page.drawLine({
    start: { x: leftMargin, y }, end: { x: rightEdge, y },
    thickness: 2, color: bloodRed,
  })

  // ── Supplier Details (Rule 46(a)) ──
  y -= 24
  const companyLines = [
    "UNHOLY CO.",
    "New Delhi, India",
    `State: ${SUPPLIER_STATE} (${SUPPLIER_STATE_CODE})`,
    "GSTIN: [As applicable]",
  ]
  for (const line of companyLines) {
    page.drawText(line, { x: leftMargin, y, size: 9, font: fontRegular, color: grey })
    y -= 14
  }

  // ── Invoice details on right (Rule 46(b), (c)) ──
  let rightY = height - 50 - 18 - 16 - 24
  const invoiceNo = generateInvoiceNumber(orderId, timestamp)
  const invoiceDetails: [string, string][] = [
    ["Invoice No:", invoiceNo],
    ["Invoice Date:", formatInvoiceDate(timestamp)],
    ["Payment ID:", paymentId],
  ]

  // Place of Supply (Rule 46(l))
  if (shippingState) {
    const code = getStateCode(shippingState)
    invoiceDetails.push(["Place of Supply:", `${shippingState}${code ? ` (${code})` : ""}`])
  }

  for (const [label, value] of invoiceDetails) {
    const labelWidth = fontRegular.widthOfTextAtSize(label, 9)
    page.drawText(label, {
      x: rightEdge - 200, y: rightY, size: 9, font: fontRegular, color: grey,
    })
    page.drawText(value, {
      x: rightEdge - 200 + labelWidth + 6, y: rightY, size: 9, font: fontBold, color: black,
    })
    rightY -= 14
  }

  // ── Bill To / Ship To (Rule 46(d), (e), (m)) ──
  y -= 10
  page.drawText("BILL TO / SHIP TO", { x: leftMargin, y, size: 9, font: fontBold, color: bloodRed })
  y -= 16
  page.drawText(customerName || "Customer", {
    x: leftMargin, y, size: 10, font: fontBold, color: black,
  })
  y -= 14
  page.drawText(customerEmail, { x: leftMargin, y, size: 9, font: fontRegular, color: grey })
  if (customerPhone) {
    y -= 14
    page.drawText(`Phone: ${customerPhone}`, { x: leftMargin, y, size: 9, font: fontRegular, color: grey })
  }
  if (shippingAddress) {
    y -= 14
    const fullAddress = [shippingAddress, shippingCity, shippingState, shippingPincode]
      .filter(Boolean).join(", ")
    const addressLines = wrapText(fullAddress, 70)
    for (const line of addressLines) {
      page.drawText(line, { x: leftMargin, y, size: 9, font: fontRegular, color: grey })
      y -= 14
    }
  }
  // Buyer state name & code (Rule 46(e))
  if (shippingState && buyerStateCode) {
    page.drawText(`State: ${shippingState} (${buyerStateCode})`, {
      x: leftMargin, y, size: 9, font: fontRegular, color: grey,
    })
    y -= 14
  }

  // Reverse Charge declaration (Rule 46(n))
  y -= 4
  page.drawText("Tax payable on reverse charge: No", {
    x: leftMargin, y, size: 8, font: fontRegular, color: grey,
  })

  // ── Items Table (Rule 46(f)–(k)) ──
  y -= 20
  page.drawRectangle({
    x: leftMargin, y: y - 4, width: rightEdge - leftMargin, height: 22,
    color: rgb(0.95, 0.95, 0.95),
  })

  const cols = [
    { label: "Description", x: leftMargin + 8 },
    { label: "HSN", x: 240 },
    { label: "Qty", x: 295 },
    { label: "Unit", x: 335 },
    { label: "Rate (₹)", x: 380 },
    { label: "Taxable Val (₹)", x: 460 },
  ]
  for (const col of cols) {
    page.drawText(col.label, { x: col.x, y: y + 2, size: 7.5, font: fontBold, color: grey })
  }

  // Table row
  y -= 26
  page.drawText(`BloodThirst — ${pack}`, {
    x: cols[0]!.x, y, size: 9, font: fontRegular, color: black,
  })
  page.drawText("2201", { x: cols[1]!.x, y, size: 9, font: fontRegular, color: black })
  page.drawText(String(quantity), { x: cols[2]!.x, y, size: 9, font: fontRegular, color: black })
  page.drawText("Can", { x: cols[3]!.x, y, size: 9, font: fontRegular, color: black })
  const perUnit = originalBasePrice / quantity
  page.drawText(perUnit.toFixed(2), {
    x: cols[4]!.x, y, size: 9, font: fontRegular, color: black,
  })
  page.drawText(originalBasePrice.toLocaleString("en-IN"), {
    x: cols[5]!.x, y, size: 9, font: fontRegular, color: black,
  })

  // HSN/SAC sub-label
  y -= 14
  page.drawText("Natural Mineral Water", {
    x: cols[0]!.x, y, size: 7, font: fontRegular, color: grey,
  })

  // Separator
  y -= 12
  page.drawLine({
    start: { x: leftMargin, y }, end: { x: rightEdge, y },
    thickness: 0.5, color: lineGrey,
  })

  // ── Totals ──
  y -= 22
  const totalCol = 370
  const totalValCol = 460

  const totals: [string, string, boolean?][] = [
    ["Taxable Value", `₹${originalBasePrice.toLocaleString("en-IN")}`],
  ]

  // Discount line (Section 15(3) CGST Act — must show on invoice)
  if (discountAmount && discountAmount > 0) {
    const discountLabel = promoCode ? `Discount (${promoCode})` : "Discount"
    totals.push([discountLabel, `− ₹${discountAmount.toLocaleString("en-IN")}`])
    totals.push(["Taxable Value (after discount)", `₹${basePrice.toLocaleString("en-IN")}`])
  }

  // Tax breakdown — IGST for interstate, CGST+SGST for intra-state
  if (isInterstate) {
    totals.push([`IGST (${GST_RATE * 100}%)`, `₹${gstAmount.toLocaleString("en-IN")}`])
  } else {
    totals.push([`CGST (${(GST_RATE * 100) / 2}%)`, `₹${(gstAmount / 2).toLocaleString("en-IN")}`])
    totals.push([`SGST (${(GST_RATE * 100) / 2}%)`, `₹${(gstAmount / 2).toLocaleString("en-IN")}`])
  }

  for (const [label, value] of totals) {
    page.drawText(label, { x: totalCol, y, size: 9, font: fontRegular, color: grey })
    page.drawText(value, { x: totalValCol, y, size: 9, font: fontRegular, color: black })
    y -= 18
  }

  // Grand total line
  y -= 4
  page.drawLine({
    start: { x: totalCol, y: y + 6 }, end: { x: rightEdge, y: y + 6 },
    thickness: 1, color: bloodRed,
  })
  page.drawText("TOTAL", { x: totalCol, y: y - 8, size: 11, font: fontBold, color: black })
  page.drawText(`₹${amount.toLocaleString("en-IN")}`, {
    x: totalValCol, y: y - 8, size: 11, font: fontBold, color: bloodRed,
  })

  // Amount in words
  y -= 28
  page.drawText(`Amount in words: ${amountInWords(amount)} Rupees Only`, {
    x: leftMargin, y, size: 8, font: fontRegular, color: grey,
  })

  // ── Footer ──
  const footerY = 60
  page.drawLine({
    start: { x: leftMargin, y: footerY + 30 }, end: { x: rightEdge, y: footerY + 30 },
    thickness: 0.5, color: lineGrey,
  })
  page.drawText("This is a computer-generated invoice and does not require a physical signature.", {
    x: leftMargin, y: footerY + 16, size: 7, font: fontRegular, color: grey,
  })
  page.drawText("UNHOLY CO. — theunholy.co — rituals@theunholy.co — +91 98700 66131", {
    x: leftMargin, y: footerY + 4, size: 7, font: fontRegular, color: grey,
  })
  page.drawText("Subject to Delhi jurisdiction.", {
    x: leftMargin, y: footerY - 8, size: 7, font: fontRegular, color: grey,
  })

  return pdf.save()
}

/**
 * Generate a sequential invoice number per financial year.
 * Format: UHC/YY-YY/ORDER_SUFFIX (max 16 chars per Rule 46(b))
 */
function generateInvoiceNumber(orderId: string, timestamp: string): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-indexed
  // Indian FY: April to March
  const fyStart = month >= 4 ? year : year - 1
  const fyEnd = fyStart + 1
  const fy = `${String(fyStart).slice(2)}-${String(fyEnd).slice(2)}`
  // Use last 6 chars of orderId as the sequence suffix
  const suffix = orderId.replace(/^order_/, "").slice(-6).toUpperCase()
  return `UHC/${fy}/${suffix}`
}

function formatInvoiceDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    })
  } catch {
    return isoString
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    if (current.length + word.length + 1 > maxChars) {
      lines.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) lines.push(current)
  return lines
}

/** Convert a number to Indian English words (up to 99,999) */
function amountInWords(n: number): string {
  if (n === 0) return "Zero"
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  const num = Math.round(n)
  if (num >= 100000) return num.toLocaleString("en-IN") // fallback for large numbers

  const parts: string[] = []

  const thousands = Math.floor(num / 1000)
  const remainder = num % 1000
  const hundreds = Math.floor(remainder / 100)
  const rest = remainder % 100

  if (thousands > 0) {
    if (thousands < 20) parts.push(ones[thousands]!)
    else parts.push(`${tens[Math.floor(thousands / 10)]} ${ones[thousands % 10]}`.trim())
    parts.push("Thousand")
  }
  if (hundreds > 0) {
    parts.push(ones[hundreds]!, "Hundred")
  }
  if (rest > 0) {
    if (parts.length > 0) parts.push("and")
    if (rest < 20) parts.push(ones[rest]!)
    else parts.push(`${tens[Math.floor(rest / 10)]} ${ones[rest % 10]}`.trim())
  }

  return parts.join(" ")
}
