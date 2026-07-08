import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"
import { validateRequestOriginOrReferer } from "./security"

function request(headers?: HeadersInit) {
  return new NextRequest("https://theunholy.co/api/gst/verify?gstin=27ABCDE1234F1Z5", {
    headers,
  })
}

describe("validateRequestOriginOrReferer", () => {
  it("accepts a same-origin Origin header", () => {
    expect(validateRequestOriginOrReferer(request({ origin: "https://theunholy.co" })).ok).toBe(true)
  })

  it("accepts a same-origin Referer when Origin is absent", () => {
    expect(validateRequestOriginOrReferer(request({ referer: "https://theunholy.co/sin" })).ok).toBe(true)
  })

  it("rejects cross-site probes", () => {
    expect(validateRequestOriginOrReferer(request({ origin: "https://evil.example" })).ok).toBe(false)
    expect(validateRequestOriginOrReferer(request({ referer: "https://evil.example/sin" })).ok).toBe(false)
  })

  it("rejects requests with neither Origin nor Referer", () => {
    expect(validateRequestOriginOrReferer(request()).ok).toBe(false)
  })
})
