import { buildWelcomeEmailHtml } from "@/lib/email/welcome-template";
import { buildOrderConfirmationHtml, buildOrderConfirmationText, type OrderConfirmationOptions } from "@/lib/email/order-confirmation-template";
import {
  buildAbandonedCartEmail1Html, buildAbandonedCartEmail1Text,
  buildAbandonedCartEmail2Html, buildAbandonedCartEmail2Text,
  type AbandonedCartEmailOptions,
} from "@/lib/email/abandoned-cart-templates";
import { generateInvoicePdf } from "@/lib/pdf/generate-invoice";
import {
  getNextSupabaseInvoiceSeq,
  isSupabaseConfigured,
  logErrorToSupabase,
  updateSupabasePaymentByOrderId,
  uploadSupabaseInvoice,
} from "@/lib/server/supabase";

type AirtableOptions = {
  tableName?: string;
  baseId?: string;
};

type AirtableFields = Record<string, string | number | boolean | null | undefined>;

type ErrorLogOptions = {
  baseId?: string;
  route?: string;
  service?: string;
  stage?: string;
  orderId?: string;
  paymentId?: string;
  recordId?: string;
  severity?: "info" | "warning" | "error" | "critical";
  httpStatus?: number;
  extra?: AirtableFields;
};

type MailjetAttachment = {
  ContentType: string;
  Filename: string;
  Base64Content: string;
};

type MailjetOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: MailjetAttachment[];
};

const AIRTABLE_ENDPOINT = "https://api.airtable.com/v0";
const AIRTABLE_CONTENT_ENDPOINT = "https://content.airtable.com/v0";
const MAILJET_ENDPOINT = "https://api.mailjet.com/v3.1/send";

const defaultTableName = process.env.AIRTABLE_TABLE_NAME || "signups";

export function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function hasMailjetConfig() {
  return Boolean(process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET);
}

export function hasAirtableOrdersConfig() {
  return Boolean(process.env.AIRTABLE_ORDERS_BASE_ID && process.env.AIRTABLE_TOKEN);
}

export async function saveRecordToAirtable(
  fields: AirtableFields,
  options: AirtableOptions = {}
): Promise<{ id: string }> {
  const baseId = options.baseId || getRequiredEnv("AIRTABLE_BASE_ID");
  const token = getRequiredEnv("AIRTABLE_TOKEN");
  const tableName = options.tableName || defaultTableName;

  const primaryAttempt = await writeRecord(baseId, token, tableName, fields);
  if (primaryAttempt.ok) {
    return { id: primaryAttempt.id };
  }

  const sanitizedFields = removeOptionalAirtableFields(fields);
  if (sanitizedFields && sanitizedFields !== fields) {
    const retryAttempt = await writeRecord(baseId, token, tableName, sanitizedFields);
    if (retryAttempt.ok) {
      console.warn("Airtable write succeeded after stripping optional fields.");
      return { id: retryAttempt.id };
    }
  }

  throw new Error(`Airtable error (${primaryAttempt.status}): ${primaryAttempt.message}`);
}

export async function sendMailjetEmail(options: MailjetOptions): Promise<void> {
  if (!hasMailjetConfig()) {
    throw new Error("Mailjet is not configured");
  }

  const apiKey = getRequiredEnv("MAILJET_API_KEY");
  const apiSecret = getRequiredEnv("MAILJET_SECRET");
  const fromEmail = process.env.MAILJET_FROM_EMAIL || "noreply@theunholy.co";
  const fromName = process.env.MAILJET_FROM_NAME || "UNHOLY CO.";

  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  if (!recipients.length) {
    throw new Error("At least one recipient is required");
  }

  const response = await fetch(MAILJET_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
    },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: fromEmail, Name: fromName },
          To: recipients.map((email) => ({ Email: email })),
          Subject: options.subject,
          HTMLPart: options.html,
          TextPart: options.text,
          ...(options.attachments?.length ? { Attachments: options.attachments } : {}),
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Mailjet error (${response.status}): ${message}`);
  }
}

export async function sendOrderConfirmationEmail(options: OrderConfirmationOptions): Promise<void> {
  if (!hasMailjetConfig()) {
    console.warn("Mailjet is not configured; skipping order confirmation email.");
    return;
  }

  const ordersBaseId = process.env.AIRTABLE_ORDERS_BASE_ID;

  // Assign a sequential invoice number, persist it to Supabase first, and then
  // mirror it to Airtable when that mirror is configured.
  let invoiceSeq: number | undefined;
  let paymentRecordId: string | undefined;
  let hasExistingPdf = false;
  try {
    invoiceSeq = (await getNextSupabaseInvoiceSeq().catch((err) => {
      console.error("Supabase invoice sequence assignment failed, falling back to Airtable:", err);
      return null;
    })) || undefined;
    if (!invoiceSeq && ordersBaseId && process.env.AIRTABLE_TOKEN) {
      invoiceSeq = await getNextInvoiceSeq(ordersBaseId);
    }

    if (invoiceSeq && isSupabaseConfigured()) {
      await updateSupabasePaymentByOrderId(options.orderId, {
        invoice_seq: invoiceSeq,
        invoice_no: formatInvoiceNumberForStorage(invoiceSeq),
      }).catch((err) => console.error("Supabase invoice sequence mirror failed:", err));
    }

    if (ordersBaseId && process.env.AIRTABLE_TOKEN) {
      const paymentRecords = await queryAirtableRecords({
        baseId: ordersBaseId,
        tableName: "Payments",
        filterByFormula: `{Order ID} = "${options.orderId.replace(/"/g, '\\"')}"`,
        maxRecords: 1,
      });
      if (paymentRecords.length > 0) {
        paymentRecordId = paymentRecords[0]!.id;
        const existingAttachments = paymentRecords[0]!.fields["Invoice PDF"];
        hasExistingPdf = Array.isArray(existingAttachments) && existingAttachments.length > 0;
        if (invoiceSeq) {
          await updateAirtableRecord({
            baseId: ordersBaseId,
            tableName: "Payments",
            recordId: paymentRecordId,
            fields: { "Invoice Number": invoiceSeq },
          });
        }
      }
    }
  } catch (err) {
    console.error("Invoice sequence assignment failed:", err);
  }

  // Generate invoice PDF — attach to the email and store on the Airtable record
  // so the finance team can download it directly from Airtable.
  let attachments: MailjetAttachment[] = [];
  try {
    const pdfBytes = await generateInvoicePdf({
      orderId: options.orderId,
      paymentId: options.paymentId,
      pack: options.packTitle,
      quantity: options.packQty,
      amount: options.pricing?.total ?? options.packPrice,
      customerName: options.customerName,
      customerEmail: options.customerEmail,
      customerPhone: options.customerPhone,
      shippingAddress: options.shippingAddress,
      shippingCity: options.shippingCity,
      shippingState: options.shippingState,
      shippingPincode: options.shippingPincode,
      timestamp: new Date().toISOString(),
      promoCode: options.promoCode,
      discountAmount: options.pricing?.discountAmount ?? options.discountAmount,
      buyerGstNumber: options.buyerGstNumber,
      buyerBusinessName: options.buyerBusinessName,
      invoiceSeq,
      addOns: options.addOns?.map((addOn) => ({
        id: addOn.id || (addOn.title === "The Unholy Ledger" ? "unholy_ledger" : "cursed_note"),
        title: addOn.title,
        price: addOn.price,
      })),
    });

    // Cloudflare Edge safe conversion of Uint8Array to base64
    let binary = "";
    for (let i = 0; i < pdfBytes.byteLength; i++) {
      binary += String.fromCharCode(pdfBytes[i]);
    }
    const base64Pdf = btoa(binary);

    attachments = [{
      ContentType: "application/pdf",
      Filename: `UNHOLY-Invoice-${options.orderId}.pdf`,
      Base64Content: base64Pdf,
    }];

    if (isSupabaseConfigured()) {
      const storagePath = `${String(invoiceSeq || Date.now()).padStart(4, "0")}-${options.orderId}.pdf`;
      await uploadSupabaseInvoice(storagePath, pdfBytes)
        .then(() => updateSupabasePaymentByOrderId(options.orderId, { invoice_storage_path: storagePath }))
        .catch((err) => console.error("Invoice Supabase upload failed (non-blocking):", err));
    }

    // Upload to the Airtable mirror so the finance team can still access
    // invoices directly from Airtable during the migration.
    // Skipped when an attachment already exists so retries stay idempotent.
    if (ordersBaseId && paymentRecordId && !hasExistingPdf) {
      await uploadAttachmentToAirtableRecord({
        baseId: ordersBaseId,
        recordId: paymentRecordId,
        fieldName: "Invoice PDF",
        fileBytes: pdfBytes,
        filename: `UNHOLY-Invoice-${options.orderId}.pdf`,
        contentType: "application/pdf",
      }).catch((err) => console.error("Invoice Airtable attachment failed (non-blocking):", err));
    }
  } catch (err) {
    // Don't block the email if PDF generation fails
    console.error("Invoice PDF generation failed, sending email without attachment:", err);
  }

  await sendMailjetEmail({
    to: options.customerEmail,
    subject: `Order confirmed — BloodThirst is on its way.`,
    html: buildOrderConfirmationHtml(options),
    text: buildOrderConfirmationText(options),
    attachments,
  });
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  if (!hasMailjetConfig()) {
    console.warn("Mailjet is not configured; skipping welcome email.");
    return;
  }

  const unsubscribeUrl = process.env.MAILJET_UNSUB_URL || "https://theunholy.co/unsubscribe";
  const subject = process.env.MAILJET_WELCOME_SUBJECT || "Your Damnation Is Served";

  await sendMailjetEmail({
    to: email,
    subject,
    html: buildWelcomeEmailHtml({ unsubscribeUrl }),
  });
}

export async function sendSubscriptionConfirmationEmail(options: {
  email: string;
  confirmUrl: string;
}): Promise<void> {
  if (!hasMailjetConfig()) {
    console.warn("Mailjet is not configured; skipping subscription confirmation email.");
    return;
  }

  await sendMailjetEmail({
    to: options.email,
    subject: "Confirm your UNHOLY CO. subscription",
    html: `
      <p>Confirm your email to join the UNHOLY CO. list.</p>
      <p><a href="${options.confirmUrl}">Confirm subscription</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
    text: `Confirm your UNHOLY CO. subscription: ${options.confirmUrl}`,
  });
}

/** Retry a fetch up to maxRetries times on 429 (Airtable rate limit), with exponential backoff. */
async function fetchWithAirtableRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)
    if (response.status !== 429 || attempt === maxRetries) {
      return response
    }
    // Airtable returns Retry-After header; fall back to exponential backoff (250ms, 500ms, 1000ms)
    const retryAfter = Number(response.headers.get("Retry-After") || 0)
    const delayMs = retryAfter > 0 ? retryAfter * 1000 : 250 * Math.pow(2, attempt)
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  // Unreachable but satisfies TS
  return fetch(url, options)
}

async function writeRecord(baseId: string, token: string, tableName: string, fields: AirtableFields) {
  const response = await fetchWithAirtableRetry(
    `${AIRTABLE_ENDPOINT}/${baseId}/${encodeURIComponent(tableName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [{ fields }],
      }),
    }
  );

  if (response.ok) {
    const data = await response.json();
    return { ok: true as const, id: data.records[0].id as string };
  }

  const message = await response.text();
  return {
    ok: false as const,
    status: response.status,
    message,
  };
}

function removeOptionalAirtableFields(fields: AirtableFields) {
  const optionalKeys = [
    "Type", "Source", "SubmittedAt",
    "Promo Code", "Discount Amount", "GST Number", "GST number", "GST Business Name"
  ];
  let changed = false;
  const sanitizedEntries = Object.entries(fields).filter(([key]) => {
    const shouldDrop = optionalKeys.includes(key);
    if (shouldDrop) changed = true;
    return !shouldDrop;
  });

  return changed ? Object.fromEntries(sanitizedEntries) : null;
}

function truncateForAirtable(value: string, maxLength = 10000) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function serializeErrorForLog(error: unknown) {
  if (error instanceof Error) {
    const candidate = error as Error & {
      status?: number;
      statusCode?: number;
      cause?: unknown;
    };

    return {
      message: error.message,
      stack: error.stack || "",
      name: error.name || "Error",
      httpStatus:
        typeof candidate.status === "number"
          ? candidate.status
          : typeof candidate.statusCode === "number"
            ? candidate.statusCode
            : undefined,
      details: candidate.cause ? JSON.stringify({ cause: candidate.cause }) : "",
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      stack: "",
      name: "Error",
      httpStatus: undefined,
      details: "",
    };
  }

  const serialized = JSON.stringify(error);
  return {
    message: serialized || "Unknown Error",
    stack: "",
    name: "Error",
    httpStatus: undefined,
    details: serialized || "",
  };
}

/**
 * Log an error to the Airtable 'Errors' table.
 */
export async function logErrorToAirtable(context: string, error: unknown, options: ErrorLogOptions = {}) {
  try {
    await logErrorToSupabase(context, error, {
      route: options.route,
      service: options.service,
      stage: options.stage,
      orderId: options.orderId,
      paymentId: options.paymentId,
      recordId: options.recordId,
      severity: options.severity || "error",
      httpStatus: options.httpStatus,
      ...(options.extra || {}),
    });

    const baseId = options.baseId || process.env.AIRTABLE_ORDERS_BASE_ID;
    const token = process.env.AIRTABLE_TOKEN;
    if (!baseId || !token) return;

    const serialized = serializeErrorForLog(error);
    const richFields: AirtableFields = {
      Timestamp: new Date().toISOString(),
      Context: context,
      Message: truncateForAirtable(serialized.message, 5000),
      Stack: truncateForAirtable(serialized.stack, 20000),
      "Error Name": serialized.name,
      Severity: options.severity || "error",
      Route: options.route,
      Service: options.service,
      Stage: options.stage,
      "Order ID": options.orderId,
      "Payment ID": options.paymentId,
      "Record ID": options.recordId,
      "HTTP Status": options.httpStatus ?? serialized.httpStatus,
      Details: truncateForAirtable(serialized.details, 10000),
      ...options.extra,
    };

    const richAttempt = await writeRecord(baseId, token, "Errors", richFields);
    if (richAttempt.ok) {
      return;
    }

    await writeRecord(baseId, token, "Errors", {
      Context: context,
      Message: truncateForAirtable(serialized.message, 5000),
      Stack: truncateForAirtable(serialized.stack, 20000),
    });
  } catch (err) {
    console.error("Failed to log error to Airtable:", err);
  }
}


/* ─── Airtable Query & Update Helpers ─── */

export type AirtableRecord = {
  id: string;
  // Unknown values because Airtable can return attachment arrays and other
  // complex types that don't fit the write-side AirtableFields primitives.
  fields: Record<string, unknown>;
};

export async function queryAirtableRecords(options: {
  baseId: string;
  tableName: string;
  filterByFormula: string;
  maxRecords?: number;
  sort?: Array<{ field: string; direction?: "asc" | "desc" }>;
}): Promise<AirtableRecord[]> {
  const token = getRequiredEnv("AIRTABLE_TOKEN");
  const params = new URLSearchParams({
    filterByFormula: options.filterByFormula,
    maxRecords: String(options.maxRecords || 100),
  });
  if (options.sort) {
    options.sort.forEach((s, i) => {
      params.append(`sort[${i}][field]`, s.field);
      if (s.direction) params.append(`sort[${i}][direction]`, s.direction);
    });
  }

  const url = `${AIRTABLE_ENDPOINT}/${options.baseId}/${encodeURIComponent(options.tableName)}?${params}`;
  const response = await fetchWithAirtableRetry(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Airtable query error (${response.status}): ${message}`);
  }

  const data = await response.json() as { records: AirtableRecord[] };
  return data.records;
}

export async function updateAirtableRecord(options: {
  baseId: string;
  tableName: string;
  recordId: string;
  fields: AirtableFields;
}): Promise<void> {
  const token = getRequiredEnv("AIRTABLE_TOKEN");
  const url = `${AIRTABLE_ENDPOINT}/${options.baseId}/${encodeURIComponent(options.tableName)}/${options.recordId}`;

  const response = await fetchWithAirtableRetry(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: options.fields }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Airtable update error (${response.status}): ${message}`);
  }
}

/* ─── Airtable Attachment Upload ─── */

/**
 * Upload a file directly to an Airtable attachment field via the content
 * upload API. Throws on non-2xx so callers can decide whether to swallow errors.
 */
async function uploadAttachmentToAirtableRecord(options: {
  baseId: string
  recordId: string
  fieldName: string
  fileBytes: Uint8Array
  filename: string
  contentType: string
}): Promise<void> {
  const token = getRequiredEnv("AIRTABLE_TOKEN")
  const url = `${AIRTABLE_CONTENT_ENDPOINT}/${options.baseId}/${options.recordId}/${encodeURIComponent(options.fieldName)}/uploadAttachment`

  const response = await fetchWithAirtableRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contentType: options.contentType,
      filename: options.filename,
      file: uint8ToBase64(options.fileBytes),
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Airtable attachment upload error (${response.status}): ${message}`)
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function formatInvoiceNumberForStorage(invoiceSeq: number) {
  const now = new Date();
  const fyStart = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  return `UHC${String(fyStart).slice(2)}/${invoiceSeq}`;
}

/* ─── Invoice Sequence Helper ─── */

/**
 * Get the next sequential invoice number for the current Indian financial year.
 *
 * Uses KV as an atomic counter with a short-lived mutex to serialize concurrent
 * increments. Falls back to counting Airtable records if KV is unavailable
 * (local dev) or if the counter needs to be seeded for the first time in a FY.
 *
 * GST compliance requires strictly-unique, monotonically-increasing invoice
 * numbers per FY — the previous implementation (plain record count) produced
 * duplicates under concurrent payments.
 */
export async function getNextInvoiceSeq(ordersBaseId: string): Promise<number> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const fyStart = month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  const fyLabel = `${fyStart}-${fyStart + 1}`;
  const fyStartDate = `${fyStart}-04-01T00:00:00.000Z`;
  const fyEndDate = `${fyStart + 1}-04-01T00:00:00.000Z`;

  const maxInvoiceSeqFromAirtable = async (): Promise<number> => {
    const records = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Payments",
      filterByFormula: `AND(IS_AFTER({Timestamp}, "${fyStartDate}"), IS_BEFORE({Timestamp}, "${fyEndDate}"), {Invoice Number} != "")`,
      maxRecords: 1000,
    });
    return records.reduce((max, record) => {
      const seq = Number(record.fields["Invoice Number"] || 0);
      return Number.isFinite(seq) && seq > max ? seq : max;
    }, 0);
  };

  const { getKVNamespace } = await import("@/lib/server/kv");
  const kv = await getKVNamespace();
  if (!kv) {
    // Local dev: best-effort, non-atomic (acceptable since not GST-critical locally)
    return (await maxInvoiceSeqFromAirtable()) + 1;
  }

  const counterKey = `invoice-seq:${fyLabel}`;
  const lockKey = `invoice-seq-lock:${fyLabel}`;
  const lockToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Acquire short-lived mutex — KV has no true CAS, so we use get/put + verify.
  // Cloudflare KV requires at least 60s TTL for expiring entries.
  for (let attempt = 0; attempt < 10; attempt++) {
    const existingLock = await kv.get(lockKey);
    if (!existingLock) {
      await kv.put(lockKey, lockToken, { expirationTtl: 60 });
      // Verify we won the race (another worker may have written simultaneously)
      const verify = await kv.get(lockKey);
      if (verify === lockToken) break;
    }
    if (attempt === 9) {
      // Couldn't acquire lock — fall through and do a best-effort read/write.
      // Worst case: rare duplicate that ops can reconcile manually.
      console.warn("Invoice sequence lock contention — proceeding without lock");
      break;
    }
    await new Promise((r) => setTimeout(r, 100 + attempt * 50));
  }

  try {
    const rawCounter = await kv.get(counterKey);
    const kvCurrent = rawCounter ? Number(rawCounter) : 0;
    // Always compare KV against Airtable so a stale KV counter can never issue
    // a duplicate after manual repairs or backfills.
    const airtableCurrent = await maxInvoiceSeqFromAirtable();
    const current = Math.max(
      Number.isFinite(kvCurrent) ? kvCurrent : 0,
      airtableCurrent,
    );
    const next = current + 1;
    // FY counters never expire during the FY; give them 400 days to cover rollover.
    await kv.put(counterKey, String(next), { expirationTtl: 400 * 24 * 60 * 60 });
    return next;
  } finally {
    // Release lock only if we still own it
    try {
      const current = await kv.get(lockKey);
      if (current === lockToken) {
        await kv.delete(lockKey);
      }
    } catch {
      // ignore
    }
  }
}

/* ─── Abandoned Cart Emails ─── */

export type AbandonedCartSendOptions = AbandonedCartEmailOptions & { customerEmail: string };

export async function sendAbandonedCartEmail1(options: AbandonedCartSendOptions): Promise<void> {
  if (!hasMailjetConfig()) {
    console.warn("Mailjet is not configured; skipping abandoned cart email 1.");
    return;
  }

  await sendMailjetEmail({
    to: options.customerEmail,
    subject: "Your ritual was left unfinished.",
    html: buildAbandonedCartEmail1Html(options),
    text: buildAbandonedCartEmail1Text(options),
  });
}

export async function sendAbandonedCartEmail2(options: AbandonedCartSendOptions): Promise<void> {
  if (!hasMailjetConfig()) {
    console.warn("Mailjet is not configured; skipping abandoned cart email 2.");
    return;
  }

  await sendMailjetEmail({
    to: options.customerEmail,
    subject: "The BloodThirst doesn't forget.",
    html: buildAbandonedCartEmail2Html(options),
    text: buildAbandonedCartEmail2Text(options),
  });
}
