 "use client"

import { FormEvent, useState } from "react"

type ContactFormProps = {
  action?: string
}

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "success" }
  | { state: "error"; message: string }

export function ContactForm({ action }: ContactFormProps) {
  const [status, setStatus] = useState<Status>({ state: "idle" })
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!action) {
      setStatus({ state: "error", message: "Contact endpoint is not configured." })
      return
    }

    if (!form.name || !form.email || !form.message) {
      setStatus({ state: "error", message: "Name, email, and message are required." })
      return
    }

    setStatus({ state: "sending" })
    try {
      const formData = new FormData()
      formData.append("source", "contact")
      formData.append("name", form.name)
      formData.append("email", form.email)
      if (form.phone) formData.append("phone", form.phone)
      formData.append("message", form.message)

      const res = await fetch(action, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Failed to send.")
      }

      setStatus({ state: "success" })
      setForm({ name: "", email: "", phone: "", message: "" })
    } catch (error: any) {
      setStatus({ state: "error", message: error?.message ?? "Something went wrong." })
    }
  }

  return (
    <form className="glass-panel space-y-4" onSubmit={onSubmit}>
      <div>
        <label htmlFor="name" className="text-xs uppercase tracking-wide text-bone/60">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Your name"
          className="mt-1 w-full rounded-xl border border-ash bg-ash/40 px-3 py-2 text-offwhite"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="email" className="text-xs uppercase tracking-wide text-bone/60">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@domain"
          className="mt-1 w-full rounded-xl border border-ash bg-ash/40 px-3 py-2 text-offwhite"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="phone" className="text-xs uppercase tracking-wide text-bone/60">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          placeholder="+91"
          className="mt-1 w-full rounded-xl border border-ash bg-ash/40 px-3 py-2 text-offwhite"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="message" className="text-xs uppercase tracking-wide text-bone/60">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          placeholder="Tell us what you need"
          className="mt-1 min-h-[140px] w-full rounded-xl border border-ash bg-ash/40 px-3 py-2 text-offwhite"
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={status.state === "sending"}>
        {status.state === "sending" ? "Sending..." : "Send incantation"}
      </button>

      <div className="text-xs text-offwhite/60" aria-live="polite">
        {status.state === "success" && "Summoned successfully. We’ll respond within 24 hours."}
        {status.state === "error" && (
          <span className="text-blood/90">Unable to send: {status.message}</span>
        )}
      </div>
    </form>
  )
}
