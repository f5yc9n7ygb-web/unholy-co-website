"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as THREE from "three"
// @ts-ignore
import FOG from "vanta/dist/vanta.fog.min"
import Link from "next/link"

const CHAPTERS = [
  {
    id: 1,
    title: "The Reaper Knocks",
    status: "UNLOCKED",
    blurb: "It starts with a knock and ends with you questioning your reflection.",
    href: "/bloodverse/chapter-1",
    x: 20, // left %
    y: 30, // top %
    symbol: "☨",
  },
  {
    id: 2,
    title: "The Feast of Shadows",
    status: "LOCKED",
    blurb: "They drank. The city screamed. Coming soon.",
    href: "/bloodverse",
    x: 70,
    y: 45,
    symbol: "♆",
  },
  {
    id: 3,
    title: "The Choir of Ash",
    status: "LOCKED",
    blurb: "Final chorus meets dawn. Hydration becomes omen.",
    href: "/bloodverse",
    x: 40,
    y: 75,
    symbol: "⛧",
  },
]

export function InteractiveVault() {
  const [vantaEffect, setVantaEffect] = useState<any>(null)
  const vantaRef = useRef<HTMLDivElement>(null)
  
  // Custom Click Logic
  const [activeChapter, setActiveChapter] = useState<number | null>(null)

  useEffect(() => {
    if (!vantaEffect && typeof window !== "undefined") {
      setVantaEffect(
        FOG({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          highlightColor: 0x220000,
          midtoneColor: 0x440000,
          lowlightColor: 0x0a0a0a,
          baseColor: 0x050505,
          blurFactor: 0.6,
          speed: 1.5,
          zoom: 0.8,
        })
      )
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy()
    }
  }, [vantaEffect])

  return (
    <div className="relative h-[80vh] min-h-[600px] w-full overflow-hidden rounded-[2.5rem] border border-blood/20 bg-black">
      {/* Dynamic Background */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />
      
      {/* Overlay Gradient to blend with page */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none" />

      {/* Nodes Map container */}
      <div className="absolute inset-0 z-10 p-10">
        {CHAPTERS.map((chap) => (
          <motion.div
            key={chap.id}
            className={`absolute ${activeChapter === chap.id ? "z-50" : "z-10"}`}
            style={{ left: `${chap.x}%`, top: `${chap.y}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: chap.id * 0.2, type: "spring" }}
          >
            {/* The outer container acts as our stable hover target */}
            <div className="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-crosshair">
              
              {/* The Rune Button */}
              <motion.button
                onClick={() => setActiveChapter(activeChapter === chap.id ? null : chap.id)}
                className={`z-10 flex h-16 w-16 items-center justify-center rounded-full border border-blood/40 bg-black/60 text-2xl text-blood shadow-[0_0_30px_rgba(176,0,32,0.3)] backdrop-blur-md transition-colors hover:border-blood hover:bg-blood/20 ${
                  chap.status === "LOCKED" ? "opacity-50" : activeChapter !== chap.id ? "animate-float" : "ring-2 ring-blood bg-blood/20"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label={chap.title}
              >
                {chap.symbol}
              </motion.button>

              {/* The Tooltip/Card Detail */}
              <AnimatePresence>
                {activeChapter === chap.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.95 }}
                    animate={{ opacity: 1, y: 10, scale: 1 }}
                    exit={{ opacity: 0, y: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-12 left-1/2 w-72 -translate-x-1/2 cursor-auto pointer-events-auto z-50 pt-6"
                  >
                    <div className="glass-panel overflow-hidden border border-blood/30 bg-black p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${chap.status === "UNLOCKED" ? "text-blood" : "text-bone/50"}`}>
                        {chap.status}
                      </span>
                      <h4 className="mt-1 text-lg font-bold text-offwhite font-serif italic">{chap.title}</h4>
                      <p className="mt-2 text-xs text-bone/70 leading-relaxed">{chap.blurb}</p>
                      
                      {chap.status === "UNLOCKED" && (
                        <Link href={chap.href as any} className="mt-4 inline-block text-xs font-semibold text-blood hover:text-white transition-colors uppercase tracking-widest pointer-events-auto">
                          Enter Chapter →
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Title / Helper Text */}
      <div className="absolute inset-x-0 bottom-10 z-10 text-center pointer-events-none">
        <p className="text-xs uppercase tracking-[0.3em] text-bone/50 opacity-60">
          Navigate the Volcanic Terrain
        </p>
      </div>
    </div>
  )
}
