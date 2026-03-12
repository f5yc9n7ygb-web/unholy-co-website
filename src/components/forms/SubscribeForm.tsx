"use client"

import { FormEvent, useState } from "react"

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
}: SubscribeFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>({ state: "idle" })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setStatus({ state: "error", message: "Email is required." })
      return
    }

    setStatus({ state: "sending" })

    try {
      const formData = new FormData()
      formData.append("email", trimmedEmail)
      formData.append("source", source)

      const response = await fetch(action, {
        method: "POST",
        body: formData,
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Unable to join the list right now.")
      }

      setEmail("")
      setStatus({ state: "success", message: successMessage })
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
