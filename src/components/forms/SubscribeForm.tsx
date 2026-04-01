"use client"

import { FormEvent, useState } from "react"
import { resolveSafeAction } from "@/lib/client/safe-action"

type SubscribeFormProps = {
  source?: string
  action?: string
  buttonLabel?: string
  placeholder?: string
  formClassName?: string
  inputClassName?: string
  buttonClassName?: string
  statusClassName?: string
  successMessage?: string
  onSuccess?: () => void
}

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "success"; message: string }
  | { state: "error"; message: string }

export function SubscribeForm({
  source = "website",
  action = "/api/subscribe",
  buttonLabel = "Stay Unholy",
  placeholder = "Enter your email",
  formClassName,
  inputClassName,
  buttonClassName,
  statusClassName,
  successMessage = "You’re in. Watch your inbox for the next ritual.",
  onSuccess,
}: SubscribeFormProps) {
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [status, setStatus] = useState<Status>({ state: "idle" })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status.state === "sending") return // prevent double submit

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setStatus({ state: "error", message: "Email is required." })
      return
    }

    setStatus({ state: "sending" })

    try {
      const response = await fetch(resolveSafeAction(action, "/api/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          source,
          company,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        throw new Error("Unable to join the list right now.")
      }

      setEmail("")
      setCompany("")
      setStatus({
        state: "success",
        message: "Check your inbox and confirm your email to finish subscribing.",
      })
      onSuccess?.()
    } catch (error: any) {
      setStatus({
        state: "error",
        message: error?.message || "Unable to join the list right now.",
      })
    }
  }

  return (
    <div className="space-y-3">
      <form className={formClassName} onSubmit={onSubmit}>
        <input
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden opacity-0"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder={placeholder}
          className={inputClassName}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (status.state !== "idle") {
              setStatus({ state: "idle" })
            }
          }}
        />
        <button
          className={buttonClassName}
          type="submit"
          disabled={status.state === "sending"}
        >
          {status.state === "sending" ? "Submitting..." : buttonLabel}
        </button>
      </form>

      <p className={statusClassName} aria-live="polite">
        {status.state === "success" ? status.message : null}
        {status.state === "error" ? `Unable to subscribe: ${status.message}` : null}
      </p>
    </div>
  )
}
