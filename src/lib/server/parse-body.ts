import { Buffer } from "node:buffer"
import { NextRequest } from "next/server"

export type ParsedBody = Record<string, string>

const JSON_CONTENT_TYPES = ["application/json", "application/ld+json"]
const FORM_URLENCODED_CONTENT_TYPE = "application/x-www-form-urlencoded"
const DEFAULT_MAX_BYTES = 16 * 1024

export async function parseRequestBody(
  request: NextRequest,
  maxBytes = DEFAULT_MAX_BYTES
): Promise<ParsedBody> {
  const contentType = (request.headers.get("content-type") || "").toLowerCase()
  const contentLengthHeader = request.headers.get("content-length")
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader)
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error("Payload too large.")
    }
  }

  if (JSON_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    const text = await request.text()
    if (Buffer.byteLength(text) > maxBytes) {
      throw new Error("Payload too large.")
    }

    const json = JSON.parse(text)
    if (typeof json !== "object" || json === null) {
      throw new Error("Invalid JSON payload")
    }
    return Object.entries(json).reduce<ParsedBody>((acc, [key, value]) => {
      if (value === undefined || value === null) return acc
      acc[key] = typeof value === "string" ? value : JSON.stringify(value)
      return acc
    }, {})
  }

  if (!contentType || contentType.includes(FORM_URLENCODED_CONTENT_TYPE)) {
    const text = await request.text()
    if (Buffer.byteLength(text) > maxBytes) {
      throw new Error("Payload too large.")
    }

    const params = new URLSearchParams(text)
    const data: ParsedBody = {}
    params.forEach((value, key) => {
      data[key] = value
    })
    return data
  }

  throw new Error(`Unsupported content type: ${contentType || "none"}`)
}
