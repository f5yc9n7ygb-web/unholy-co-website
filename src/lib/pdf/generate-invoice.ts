import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { CheckoutAddOnRecord } from "@/lib/shop/addons"
import { GST_RATE } from "@/lib/shop/catalog"
import { createPaidReceiptPricing } from "@/lib/shop/receipt"
import {
  COMPANY_GSTIN,
  COMPANY_LEGAL_NAME,
  COMPANY_REGISTERED_ADDRESS_LINES,
} from "@/lib/site/company"
import { UHC_LOGO_BASE64 } from "./logo"

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
  /** Buyer GSTIN — present for B2B orders */
  buyerGstNumber?: string
  /** Buyer's registered business/trade name */
  buyerBusinessName?: string
  /** Sequential invoice number within the financial year */
  invoiceSeq?: number
  /** Exact invoice number to render when repairing already-issued PDFs */
  invoiceNumber?: string
  /**
   * Override the interstate/intra-state determination. Used when reissuing an
   * invoice for a migrated row whose state was corrected after the original
   * invoice was issued — we keep the original tax treatment to avoid changing
   * a stamped CGST+SGST invoice into IGST on reprint.
   */
  taxType?: "CGST+SGST" | "IGST"
  /** Paid checkout add-ons included in the captured amount. */
  addOns?: CheckoutAddOnRecord[]
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

function getGstinStateCode(gstin?: string): string {
  const code = (gstin || "").trim().slice(0, 2)
  return /^\d{2}$/.test(code) ? code : ""
}

function getStateNameByCode(code: string): string {
  return Object.entries(STATE_CODES).find(([, stateCode]) => stateCode === code)?.[0]
    ?.split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || ""
}

function toPaise(amount: number): number {
  return Math.round(amount * 100)
}

function fromPaise(paise: number): number {
  return paise / 100
}

function taxExclusivePaise(inclusivePaise: number): number {
  return Math.round(inclusivePaise / (1 + GST_RATE))
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function splitTaxPaise(totalTaxPaise: number): [number, number] {
  const firstHalf = Math.floor(totalTaxPaise / 2)
  return [firstHalf, totalTaxPaise - firstHalf]
}

function allocatePaise(totalPaise: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((sum, value) => sum + Math.max(0, value), 0)
  if (totalPaise <= 0 || totalWeight <= 0) return weights.map(() => 0)

  let remaining = totalPaise
  return weights.map((weight, index) => {
    if (index === weights.length - 1) return remaining
    const share = Math.min(remaining, Math.round((totalPaise * Math.max(0, weight)) / totalWeight))
    remaining -= share
    return share
  })
}

/** Supplier state — Uttar Pradesh */
const SUPPLIER_STATE = "Uttar Pradesh"
const SUPPLIER_STATE_CODE = "09"

function normalizeInvoiceAddOns(addOns: CheckoutAddOnRecord[]) {
  return addOns.flatMap((addOn) => {
    const grossInclusivePaise = toPaise(addOn.price)
    if (grossInclusivePaise <= 0) return []

    const description = addOn.title || (addOn.id === "cursed_note" ? "Cursed Note" : "The Unholy Ledger")
    const subDescription = addOn.id === "cursed_note"
      ? "Personalized printed note add-on"
      : "Consented public digital ledger entry"

    return [{
      description,
      subDescription,
      hsn: "9985",
      quantity: 1,
      unit: "Item",
      grossInclusivePaise,
    }]
  })
}

/**
 * Generate a GST-compliant A4 tax invoice PDF.
 *
 * Mandatory fields per Rule 46 of CGST Rules 2017:
 * - Supplier name, address, GSTIN
 * - Sequential invoice number (unique per FY)
 * - Date of issue
 * - Recipient name, address, state name + code (for B2C > Rs. 50k or interstate)
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
    timestamp, promoCode, discountAmount, buyerGstNumber, buyerBusinessName,
    addOns = [],
  } = data

  const pricing = createPaidReceiptPricing(amount, discountAmount)
  const amountPaise = toPaise(pricing.total)
  const discountPaise = toPaise(pricing.discountAmount)
  const originalAmountPaise = toPaise(pricing.grossTotal)
  const addOnInvoiceLines = normalizeInvoiceAddOns(addOns)
  const addOnGrossPaise = addOnInvoiceLines.reduce((sum, line) => sum + line.grossInclusivePaise, 0)
  const packGrossInclusivePaise = Math.max(0, originalAmountPaise - addOnGrossPaise)
  const grossInvoiceLines = [
    {
      description: `BloodThirst — ${pack}`,
      subDescription: "Natural Mineral Water",
      hsn: "2201",
      quantity,
      unit: "Can",
      grossInclusivePaise: packGrossInclusivePaise,
    },
    ...addOnInvoiceLines,
  ].filter((line) => line.grossInclusivePaise > 0)
  const discountAllocations = allocatePaise(discountPaise, grossInvoiceLines.map((line) => line.grossInclusivePaise))
  const invoiceLines = grossInvoiceLines.map((line, index) => {
    const lineDiscountPaise = discountAllocations[index] || 0
    const netInclusivePaise = Math.max(0, line.grossInclusivePaise - lineDiscountPaise)
    const grossLineTaxablePaise = taxExclusivePaise(line.grossInclusivePaise)
    const taxableLinePaise = taxExclusivePaise(netInclusivePaise)
    return {
      ...line,
      grossTaxablePaise: grossLineTaxablePaise,
      taxablePaise: taxableLinePaise,
      discountTaxablePaise: Math.max(0, grossLineTaxablePaise - taxableLinePaise),
    }
  })
  const grossTaxablePaise = invoiceLines.reduce((sum, line) => sum + line.grossTaxablePaise, 0)
  const taxablePaise = invoiceLines.reduce((sum, line) => sum + line.taxablePaise, 0)
  const discountTaxablePaise = invoiceLines.reduce((sum, line) => sum + line.discountTaxablePaise, 0)
  const gstPaise = amountPaise - taxablePaise

  // Determine if interstate (IGST) or intra-state (CGST+SGST).
  // We sell from UP. If old/backfilled records are missing a normalized state,
  // keep them intra-state instead of incorrectly defaulting UP buyers to IGST.
  const buyerStateCode = (shippingState ? getStateCode(shippingState) : "") || getGstinStateCode(buyerGstNumber)
  const buyerStateName = shippingState || getStateNameByCode(buyerStateCode)
  const isInterstate = data.taxType
    ? data.taxType === "IGST"
    : buyerStateCode !== "" && buyerStateCode !== SUPPLIER_STATE_CODE

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

  // Load the logo
  const logoBytes = Uint8Array.from(atob(UHC_LOGO_BASE64), c => c.charCodeAt(0))
  const logoImage = await pdf.embedPng(logoBytes)
  
  // ── Header ──
  page.drawImage(logoImage, {
    x: leftMargin, y: y - 16, width: 36, height: 36,
  })
  page.drawText("Unholy Beverages Pvt Ltd", {
    x: leftMargin + 45, y, size: 20, font: fontBold, color: bloodRed,
  })
  page.drawText("TAX INVOICE", {
    x: rightEdge - fontBold.widthOfTextAtSize("TAX INVOICE", 14),
    y: y + 4, size: 14, font: fontBold, color: black,
  })

  y -= 18
  page.drawText("Cause your liver already hates you", {
    x: leftMargin + 45, y, size: 9, font: fontRegular, color: grey,
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
    COMPANY_LEGAL_NAME,
    ...COMPANY_REGISTERED_ADDRESS_LINES,
    `State: ${SUPPLIER_STATE} (${SUPPLIER_STATE_CODE})`,
    `GSTIN: ${COMPANY_GSTIN}`,
  ]
  for (const line of companyLines) {
    page.drawText(line, { x: leftMargin, y, size: 9, font: fontRegular, color: grey })
    y -= 14
  }

  // ── Invoice details on right (Rule 46(b), (c)) ──
  let rightY = height - 50 - 18 - 16 - 24
  const invoiceNo = data.invoiceNumber || generateInvoiceNumber(orderId, timestamp, data.invoiceSeq)
  const invoiceDetails: [string, string][] = [
    ["Invoice No:", invoiceNo],
    ["Invoice Date:", formatInvoiceDate(timestamp)],
    ["Payment ID:", paymentId],
  ]

  // Place of Supply (Rule 46(l))
  if (buyerStateName) {
    invoiceDetails.push(["Place of Supply:", `${buyerStateName}${buyerStateCode ? ` (${buyerStateCode})` : ""}`])
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
  if (buyerBusinessName) {
    page.drawText(buyerBusinessName, {
      x: leftMargin, y, size: 10, font: fontBold, color: black,
    })
    y -= 14
    page.drawText(`c/o ${customerName}`, { x: leftMargin, y, size: 9, font: fontRegular, color: grey })
    y -= 14
  } else {
    page.drawText(customerName || "Customer", {
      x: leftMargin, y, size: 10, font: fontBold, color: black,
    })
    y -= 14
  }
  if (customerEmail) {
    page.drawText(customerEmail, { x: leftMargin, y, size: 9, font: fontRegular, color: grey })
  }
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
  if (buyerStateName && buyerStateCode) {
    page.drawText(`State: ${buyerStateName} (${buyerStateCode})`, {
      x: leftMargin, y, size: 9, font: fontRegular, color: grey,
    })
    y -= 14
  }

  // Buyer GSTIN (Rule 46(d) — mandatory for B2B invoices)
  if (buyerGstNumber) {
    page.drawText(`GSTIN: ${buyerGstNumber}`, {
      x: leftMargin, y, size: 9, font: fontBold, color: black,
    })
    y -= 14
  }

  // Reverse Charge declaration (Rule 46(n))
  y -= 4
  page.drawText("Tax payable on reverse charge: No", {
    x: leftMargin, y, size: 8, font: fontRegular, color: grey,
  })

  // ── Items Table (Rule 46(f)–(k)) ──
  y -= 24
  page.drawRectangle({
    x: leftMargin, y: y - 4, width: rightEdge - leftMargin, height: 22,
    color: rgb(0.95, 0.95, 0.95),
  })

  const cols = discountPaise > 0
    ? [
        { label: "Description", x: leftMargin + 8, right: 228, align: "left" as const },
        { label: "HSN/SAC", x: 238, right: 260, align: "left" as const },
        { label: "Qty", x: 278, right: 292, align: "right" as const },
        { label: "Unit", x: 305, right: 326, align: "left" as const },
        { label: "Rate", x: 344, right: 378, align: "right" as const },
        { label: "Gross Txbl", x: 390, right: 432, align: "right" as const },
        { label: "Disc.", x: 446, right: 482, align: "right" as const },
        { label: "Net Txbl", x: 496, right: 538, align: "right" as const },
      ]
    : [
        { label: "Description", x: leftMargin + 8, right: 228, align: "left" as const },
        { label: "HSN/SAC", x: 240, right: 270, align: "left" as const },
        { label: "Qty", x: 295, right: 312, align: "right" as const },
        { label: "Unit", x: 335, right: 360, align: "left" as const },
        { label: "Rate (Rs.)", x: 380, right: 424, align: "right" as const },
        { label: "Taxable Val (Rs.)", x: 440, right: 532, align: "right" as const },
      ]

  function drawCell(text: string, col: { x: number; right: number; align: "left" | "right" }, textY: number, size = 7.5, font = fontRegular, color = black) {
    page.drawText(text, {
      x: col.align === "right" ? col.right - font.widthOfTextAtSize(text, size) : col.x,
      y: textY,
      size,
      font,
      color,
    })
  }

  for (const col of cols) {
    drawCell(col.label, col, y + 2, 7, fontBold, grey)
  }

  for (const line of invoiceLines) {
    y -= 26
    const descriptionLines = wrapText(line.description, 28)
    page.drawText(descriptionLines[0] || line.description, {
      x: cols[0]!.x, y, size: 8.5, font: fontRegular, color: black,
    })
    if (descriptionLines[1]) {
      page.drawText(descriptionLines[1], {
        x: cols[0]!.x, y: y - 10, size: 7.2, font: fontRegular, color: black,
      })
    }
    drawCell(line.hsn, cols[1]!, y, 8.5)
    drawCell(String(line.quantity), cols[2]!, y, 8.5)
    drawCell(line.unit, cols[3]!, y, 8.5)
    const perUnit = line.quantity > 0 ? fromPaise(line.grossTaxablePaise) / line.quantity : 0
    drawCell(formatMoney(perUnit), cols[4]!, y, 8.5)
    if (discountPaise > 0) {
      drawCell(formatMoney(fromPaise(line.grossTaxablePaise)), cols[5]!, y, 8.5)
      drawCell(formatMoney(fromPaise(line.discountTaxablePaise)), cols[6]!, y, 8.5)
      drawCell(formatMoney(fromPaise(line.taxablePaise)), cols[7]!, y, 8.5)
    } else {
      drawCell(formatMoney(fromPaise(line.taxablePaise)), cols[5]!, y, 8.5)
    }

    y -= descriptionLines[1] ? 20 : 14
    page.drawText(line.subDescription, {
      x: cols[0]!.x, y, size: 7, font: fontRegular, color: grey,
    })

    y -= 12
    page.drawLine({
      start: { x: leftMargin, y }, end: { x: rightEdge, y },
      thickness: 0.5, color: lineGrey,
    })
  }

  // ── Totals ──
  y -= 22
  const totalCol = 350
  const totalValRight = rightEdge - 12

  function drawRightAlignedText(text: string, xRight: number, textY: number, size: number, font: typeof fontRegular, color = black) {
    page.drawText(text, {
      x: xRight - font.widthOfTextAtSize(text, size),
      y: textY,
      size,
      font,
      color,
    })
  }

  function drawTotalLabel(label: string, labelY: number) {
    const labelLines = wrapText(label, 28)
    for (let i = 0; i < labelLines.length; i++) {
      page.drawText(labelLines[i]!, {
        x: totalCol,
        y: labelY - i * 11,
        size: 9,
        font: fontRegular,
        color: grey,
      })
    }
    return Math.max(18, labelLines.length * 11 + 4)
  }

  const totals: [string, string, boolean?][] = []

  // Discount line (Section 15(3) CGST Act — must show on invoice)
  if (discountPaise > 0) {
    totals.push(["Gross Value (incl. GST)", `Rs. ${formatMoney(fromPaise(originalAmountPaise))}`])
    const discountLabel = promoCode ? `Discount (${promoCode}, incl. GST)` : "Discount (incl. GST)"
    totals.push([discountLabel, `- Rs. ${formatMoney(fromPaise(discountPaise))}`])
    totals.push(["Net Value (incl. GST)", `Rs. ${formatMoney(pricing.total)}`])
    totals.push(["Gross Taxable Value", `Rs. ${formatMoney(fromPaise(grossTaxablePaise))}`])
    totals.push(["Taxable Discount", `- Rs. ${formatMoney(fromPaise(discountTaxablePaise))}`])
  }
  totals.push(["Taxable Value", `Rs. ${formatMoney(fromPaise(taxablePaise))}`])

  // Tax breakdown — IGST for interstate, CGST+SGST for intra-state
  if (isInterstate) {
    totals.push([`IGST (${GST_RATE * 100}%)`, `Rs. ${formatMoney(fromPaise(gstPaise))}`])
  } else {
    const [cgstPaise, sgstPaise] = splitTaxPaise(gstPaise)
    totals.push([`CGST (${(GST_RATE * 100) / 2}%)`, `Rs. ${formatMoney(fromPaise(cgstPaise))}`])
    totals.push([`SGST (${(GST_RATE * 100) / 2}%)`, `Rs. ${formatMoney(fromPaise(sgstPaise))}`])
  }

  for (const [label, value] of totals) {
    const consumedHeight = drawTotalLabel(label, y)
    drawRightAlignedText(value, totalValRight, y, 9, fontRegular)
    y -= consumedHeight
  }

  // Grand total line
  y -= 4
  page.drawLine({
    start: { x: totalCol, y: y + 6 }, end: { x: rightEdge, y: y + 6 },
    thickness: 1, color: bloodRed,
  })
  page.drawText("TOTAL", { x: totalCol, y: y - 8, size: 11, font: fontBold, color: black })
  drawRightAlignedText(`Rs. ${formatMoney(pricing.total)}`, totalValRight, y - 8, 11, fontBold, bloodRed)

  // Amount in words
  y -= 28
  page.drawText(`Amount in words: ${amountInWords(pricing.total)} Rupees Only`, {
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
  page.drawText("UNHOLY CO. — theunholy.co — rituals@theunholy.co", {
    x: leftMargin, y: footerY + 4, size: 7, font: fontRegular, color: grey,
  })
  page.drawText("Subject to Mathura jurisdiction.", {
    x: leftMargin, y: footerY - 8, size: 7, font: fontRegular, color: grey,
  })

  return pdf.save()
}

/**
 * Generate a GST-safe invoice number.
 * Rule 46 limits invoice serial numbers to 16 chars. Use a short FY-prefixed
 * series so FY 2026-27 sequence 34 becomes "UHC26/34".
 */
function generateInvoiceNumber(orderId: string, timestamp: string, invoiceSeq?: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-indexed
  // Indian FY: April to March
  const fyStart = month >= 4 ? year : year - 1
  const seq = Number(invoiceSeq)
  if (!Number.isFinite(seq) || seq < 1) {
    throw new Error("Invoice sequence is required to generate an invoice number")
  }
  const invoiceNo = `UHC${String(fyStart).slice(2)}/${seq}`
  if (invoiceNo.length > 16) {
    throw new Error(`Invoice number exceeds GST 16-character limit: ${invoiceNo}`)
  }
  return invoiceNo
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
