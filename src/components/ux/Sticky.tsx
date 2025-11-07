"use client"

import { ReactNode } from "react"

export default function Sticky({ children, height = "200vh" }: { children: ReactNode; height?: string }) {
  return (
    <div style={{ height }}>
      <div className="sticky top-0 h-screen flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}