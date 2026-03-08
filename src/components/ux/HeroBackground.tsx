"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
// @ts-ignore - Vanta doesn't have official types for all effects
import FOG from "vanta/dist/vanta.fog.min"

export default function HeroBackground() {
  const [vantaEffect, setVantaEffect] = useState<any>(null)
  const vantaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      setVantaEffect(
        FOG({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          highlightColor: 0x8b0000, // Deep crimson / blood red
          midtoneColor: 0x470000, // Darker red
          lowlightColor: 0x110000, // Near black
          baseColor: 0x050505, // Obsidian black base
          blurFactor: 0.6, // Keep it smooth and liquid-like
          speed: 1.5, // Viscous, slow movement
          zoom: 1.2,
        })
      )
    }

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy()
      }
    }
  }, [vantaEffect])

  return (
    <div className="absolute inset-0 z-0 bg-[#050505]">
      {/* The container for Vanta's WebGL canvas */}
      <div ref={vantaRef} className="absolute inset-0 w-full h-full opacity-90" />
      
      {/* Dark overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none" />
    </div>
  )
}
