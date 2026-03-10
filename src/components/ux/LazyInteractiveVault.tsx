"use client"

import dynamic from "next/dynamic"

// Lazy-load the Three.js/Vanta heavy InteractiveVault component
// Prevents 624KB Three.js from blocking initial page load
export const LazyInteractiveVault = dynamic(
  () => import("./InteractiveVault").then((mod) => ({ default: mod.InteractiveVault })),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-[80vh] min-h-[600px] w-full overflow-hidden rounded-[2.5rem] border border-blood/20 bg-black flex items-center justify-center">
        <div className="text-xs uppercase tracking-[0.3em] text-bone/30 animate-pulse">
          Loading the Vault...
        </div>
      </div>
    ),
  }
)
