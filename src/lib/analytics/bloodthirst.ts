"use client"

import posthog from "posthog-js"
import { generateEventId, trackPixelCustom } from "@/lib/meta-pixel"

type BloodthirstEventProps = {
  route?: string
  scene?: string
  pack_id?: string
  value?: number
  currency?: string
  [key: string]: unknown
}

export function trackBloodthirstEvent(event: string, props: BloodthirstEventProps = {}) {
  if (typeof window === "undefined") return
  const eventId = typeof props.event_id === "string" ? props.event_id : generateEventId()
  const payload = {
    route: window.location.pathname,
    event_id: eventId,
    ...props,
  }

  try {
    posthog.capture(event, payload)
  } catch {
    /* analytics must not affect checkout */
  }

  trackPixelCustom(event, payload, eventId)
}
