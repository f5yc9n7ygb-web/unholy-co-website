"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SubscribeForm } from "@/components/forms/SubscribeForm"
import { X } from "lucide-react"

export function InitiationPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasYielded, setHasYielded] = useState(false)

  useEffect(() => {
    // Only show if they haven't seen it recently
    const seen = localStorage.getItem("unholy_initiation_seen")
    if (seen) return

    let timeout: NodeJS.Timeout

    const handleMouseLeave = (e: MouseEvent) => {
      // Exit intent detection (moving mouse up past the top of viewport)
      if (e.clientY <= 0) {
        setIsOpen(true)
        localStorage.setItem("unholy_initiation_seen", "true")
      }
    }

    // Fallback: show after 15 seconds if no exit intent
    timeout = setTimeout(() => {
      if (!localStorage.getItem("unholy_initiation_seen")) {
        setIsOpen(true)
        localStorage.setItem("unholy_initiation_seen", "true")
      }
    }, 15000)

    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.removeProperty("overflow")
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 sm:px-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-blood/40 bg-black/95 p-8 shadow-[0_0_80px_rgba(176,0,32,0.3)]"
          >
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(176,0,32,0.15),transparent_70%)]" />

            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-bone/40 transition-colors hover:text-offwhite z-10"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="mb-4 inline-block font-cinzel text-xs font-bold uppercase tracking-[0.3em] text-blood/80">
                The Initiation
              </span>
              
              <h2 className="mb-4 font-cinzel text-4xl font-black uppercase leading-tight text-offwhite">
                Sell Your<br />
                <span className="text-blood">Soul</span>
              </h2>
              
              <p className="mb-8 text-sm leading-relaxed text-bone/60">
                Window shopping is for mortals. Join the cult, seal the pact, and we&apos;ll grant you <strong className="text-offwhite">10% off</strong> your first ritual with code <strong className="text-blood">CULT10</strong>.
              </p>

              {!hasYielded ? (
                <div className="w-full">
                  <SubscribeForm
                    action="/api/subscribe"
                    buttonLabel="Seal The Pact"
                    formClassName="flex flex-col gap-3 w-full"
                    inputClassName="w-full rounded-xl border border-white/[0.08] bg-black/50 px-4 py-3 text-sm text-offwhite outline-none transition-all focus:border-blood/60 focus:ring-1 focus:ring-blood/20"
                    buttonClassName="btn btn-primary w-full py-3 text-sm"
                    statusClassName="mt-2 text-[11px] text-bone/60"
                    onSuccess={() => setHasYielded(true)}
                  />
                </div>
              ) : (
                <div className="w-full rounded-xl border border-blood/30 bg-blood/10 py-6 text-sm text-offwhite">
                  The pact is sealed. Check your inbox.
                </div>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="mt-6 text-[10px] uppercase tracking-widest text-bone/30 transition-colors hover:text-bone/60"
              >
                I prefer the abyss (No thanks)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
