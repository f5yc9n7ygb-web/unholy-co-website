'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const LAUNCH = new Date('2026-04-02T07:30:00.000Z') // April 2 1:00 PM IST

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function ShopClosedClient() {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const tick = () => {
      const diff = Math.max(0, LAUNCH.getTime() - Date.now())
      setTime({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor(diff / (1000 * 60 * 60)) % 24,
        m: Math.floor(diff / (1000 * 60)) % 60,
        s: Math.floor(diff / 1000) % 60,
      })
    }
    tick()
    const id = setInterval(() => {
      if (Date.now() >= LAUNCH.getTime()) {
        clearInterval(id)
        window.location.reload()
        return
      }
      tick()
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative min-h-screen bg-ash flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Atmospheric orbs */}
      <motion.div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(176,0,32,0.18) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(176,0,32,0.1) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-cinzel text-blood text-xs tracking-[0.35em] uppercase mb-8"
        >
          Unholy Co. &mdash; BloodThirst
        </motion.p>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="font-cinzel text-offwhite text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6"
        >
          The Ritual<br />
          <span className="text-blood">Begins Soon</span>
        </motion.h1>

        {/* Sub copy */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-bone/70 text-base sm:text-lg max-w-md leading-relaxed mb-14"
        >
          The coven is preparing. BloodThirst drops on{' '}
          <span className="text-offwhite font-medium">April 2nd at 1:00 PM</span>.
          Mark your calendar. You only get one first sip.
        </motion.p>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="w-16 h-px bg-blood/50 mb-12"
        />

        {/* Countdown */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="grid grid-cols-4 gap-4 sm:gap-8 mb-16"
          >
            {[
              { label: 'Days', value: time.d },
              { label: 'Hours', value: time.h },
              { label: 'Mins', value: time.m },
              { label: 'Secs', value: time.s },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center">
                <div
                  className="font-cinzel text-offwhite text-3xl sm:text-4xl md:text-5xl font-bold tabular-nums w-16 sm:w-20 text-center border border-white/[0.06] bg-white/[0.03] rounded-sm py-3"
                  style={{ textShadow: '0 0 20px rgba(176,0,32,0.4)' }}
                >
                  {pad(value)}
                </div>
                <div className="text-bone/40 text-[10px] sm:text-xs tracking-widest uppercase mt-2 font-cinzel">
                  {label}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Separator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-10 h-px bg-white/10" />
          <span className="text-bone/30 text-xs tracking-[0.3em] uppercase font-cinzel">02 / 04 / 2026</span>
          <div className="w-10 h-px bg-white/10" />
        </motion.div>

        {/* Footer brand line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-bone/25 text-xs tracking-[0.25em] uppercase font-cinzel"
        >
          Stay Unholy.
        </motion.p>
      </div>
    </div>
  )
}
