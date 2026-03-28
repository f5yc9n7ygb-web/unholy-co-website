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
): Promise<void> {
  const baseId = options.baseId || getRequiredEnv("AIRTABLE_BASE_ID");
  const token = getRequiredEnv("AIRTABLE_TOKEN");
  const tableName = options.tableName || defaultTableName;

  const primaryAttempt = await writeRecord(baseId, token, tableName, fields);
  if (primaryAttempt.ok) {
    return;
  }

  const sanitizedFields = removeOptionalAirtableFields(fields);
  if (sanitizedFields && sanitizedFields !== fields) {
    const retryAttempt = await writeRecord(baseId, token, tableName, sanitizedFields);
    if (retryAttempt.ok) {
      console.warn("Airtable write succeeded after stripping optional fields.");
      return;
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
      Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
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
    });

    attachments = [{
      ContentType: "application/pdf",
      Filename: `UNHOLY-Invoice-${options.orderId}.pdf`,
      Base64Content: Buffer.from(pdfBytes).toString("base64"),
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

async function writeRecord(baseId: string, token: string, tableName: string, fields: AirtableFields) {
  const response = await fetch(`${AIRTABLE_ENDPOINT}/${baseId}/${encodeURIComponent(tableName)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [
        {
          fields,
        },
      ],
    }),
  });

  if (response.ok) {
    return { ok: true as const };
  }

  const message = await response.text();
  return {
    ok: false as const,
    status: response.status,
    message,
  };
}

function removeOptionalAirtableFields(fields: AirtableFields) {
  const optionalKeys = ["Type", "Source", "SubmittedAt"];
  let changed = false;
  const sanitizedEntries = Object.entries(fields).filter(([key]) => {
    const shouldDrop = optionalKeys.includes(key);
    if (shouldDrop) changed = true;
    return !shouldDrop;
  });

  return changed ? Object.fromEntries(sanitizedEntries) : null;
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
  const response = await fetch(url, {
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

  const response = await fetch(url, {
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
