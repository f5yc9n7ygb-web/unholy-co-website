import { NextRequest } from "next/server";

export type ParsedBody = Record<string, string>;

const JSON_CONTENT_TYPES = ["application/json", "application/ld+json"];

export async function parseRequestBody(request: NextRequest): Promise<ParsedBody> {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();

  if (JSON_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    const json = await request.json();
    if (typeof json !== "object" || json === null) {
      throw new Error("Invalid JSON payload");
    }
    return Object.entries(json).reduce<ParsedBody>((acc, [key, value]) => {
      if (value === undefined || value === null) return acc;
      acc[key] = typeof value === "string" ? value : JSON.stringify(value);
      return acc;
    }, {});
  }

  if (
    !contentType ||
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    const data: ParsedBody = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") {
        data[key] = value;
      } else {
        data[key] = value.name;
      }
    });
    return data;
  }

  throw new Error(`Unsupported content type: ${contentType || "none"}`);
}
