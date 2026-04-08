import { buildWelcomeEmailHtml } from "@/lib/email/welcome-template";
import { buildOrderConfirmationHtml, buildOrderConfirmationText, type OrderConfirmationOptions } from "@/lib/email/order-confirmation-template";
import {
  buildAbandonedCartEmail1Html, buildAbandonedCartEmail1Text,
  buildAbandonedCartEmail2Html, buildAbandonedCartEmail2Text,
  type AbandonedCartEmailOptions,
} from "@/lib/email/abandoned-cart-templates";
import { Buffer } from "node:buffer";
import { generateInvoicePdf } from "@/lib/pdf/generate-invoice";

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

  // Assign a sequential invoice number and persist it to Airtable
  let invoiceSeq: number | undefined;
  try {
    const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID");
    invoiceSeq = await getNextInvoiceSeq(ordersBaseId);

    // Find the payment record and store the invoice number
    const paymentRecords = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Payments",
      filterByFormula: `{Order ID} = "${options.orderId.replace(/"/g, '\\"')}"`,
      maxRecords: 1,
    });
    if (paymentRecords.length > 0) {
      await updateAirtableRecord({
        baseId: ordersBaseId,
        tableName: "Payments",
        recordId: paymentRecords[0]!.id,
        fields: { "Invoice Number": invoiceSeq },
      });
    }
  } catch (err) {
    console.error("Invoice sequence assignment failed:", err);
  }

  // Generate invoice PDF to attach
  let attachments: MailjetAttachment[] = [];
  try {
    const pdfBytes = await generateInvoicePdf({
      orderId: options.orderId,
      paymentId: options.paymentId,
      pack: options.packTitle,
      quantity: options.packQty,
      amount: options.packPrice,
      customerName: options.customerName,
      customerEmail: options.customerEmail,
      customerPhone: options.customerPhone,
      shippingAddress: options.shippingAddress,
      shippingCity: options.shippingCity,
      shippingState: options.shippingState,
      shippingPincode: options.shippingPincode,
      timestamp: new Date().toISOString(),
      promoCode: options.promoCode,
      discountAmount: options.discountAmount,
      invoiceSeq,
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
  fields: AirtableFields;
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

  const seedFromAirtable = async (): Promise<number> => {
    const records = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Payments",
      filterByFormula: `AND(IS_AFTER({Timestamp}, "${fyStartDate}"), IS_BEFORE({Timestamp}, "${fyEndDate}"), {Invoice Number} != "")`,
      maxRecords: 1000,
    });
    return records.length;
  };

  const { getKVNamespace } = await import("@/lib/server/kv");
  const kv = await getKVNamespace();
  if (!kv) {
    // Local dev: best-effort, non-atomic (acceptable since not GST-critical locally)
    return (await seedFromAirtable()) + 1;
  }

  const counterKey = `invoice-seq:${fyLabel}`;
  const lockKey = `invoice-seq-lock:${fyLabel}`;
  const lockToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Acquire short-lived mutex — KV has no true CAS, so we use get/put + verify.
  // 5s TTL prevents a crashed worker from holding the lock forever.
  for (let attempt = 0; attempt < 10; attempt++) {
    const existingLock = await kv.get(lockKey);
    if (!existingLock) {
      await kv.put(lockKey, lockToken, { expirationTtl: 5 });
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
    let current = rawCounter ? Number(rawCounter) : NaN;
    if (!Number.isFinite(current)) {
      // First call of the FY — seed from Airtable so we don't restart at 1
      // if an earlier deploy wrote numbers directly.
      current = await seedFromAirtable();
    }
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
