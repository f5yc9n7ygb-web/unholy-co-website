import { buildWelcomeEmailHtml } from "@/lib/email/welcome-template";
import { Buffer } from "node:buffer";

type AirtableOptions = {
  tableName?: string;
};

type AirtableFields = Record<string, string | number | boolean | null | undefined>;

type MailjetOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
};

const AIRTABLE_ENDPOINT = "https://api.airtable.com/v0";
const MAILJET_ENDPOINT = "https://api.mailjet.com/v3.1/send";

const defaultTableName = process.env.AIRTABLE_TABLE_NAME || "signups";

function getRequiredEnv(name: string) {
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
  const baseId = getRequiredEnv("AIRTABLE_BASE_ID");
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
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Mailjet error (${response.status}): ${message}`);
  }
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  if (!hasMailjetConfig()) {
    console.warn("Mailjet is not configured; skipping welcome email for", email);
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
