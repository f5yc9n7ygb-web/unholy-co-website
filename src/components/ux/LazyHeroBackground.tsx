"use client"

import dynamic from "next/dynamic"

// We dynamically import the Three.js/Vanta heavy component to prevent it from 
// blocking the main initial page load, and we disable SSR since it relies on window.
export const LazyHeroBackground = dynamic(
  () => import("./HeroBackground"),
  { ssr: false }
)
