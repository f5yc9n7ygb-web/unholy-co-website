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

export async function saveRecordToAirtable(
  fields: AirtableFields,
  options: AirtableOptions = {}
): Promise<void> {
  const baseId = getRequiredEnv("AIRTABLE_BASE_ID");
  const token = getRequiredEnv("AIRTABLE_TOKEN");
  const tableName = options.tableName || defaultTableName;

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

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Airtable error (${response.status}): ${message}`);
  }
}

export async function sendMailjetEmail(options: MailjetOptions): Promise<void> {
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
  const unsubscribeUrl = process.env.MAILJET_UNSUB_URL || "https://theunholy.co/unsubscribe";
  const subject = process.env.MAILJET_WELCOME_SUBJECT || "Your Damnation Is Served";

  await sendMailjetEmail({
    to: email,
    subject,
    html: buildWelcomeEmailHtml({ unsubscribeUrl }),
  });
}
