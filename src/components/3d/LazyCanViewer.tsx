"use client"

import { useState, useEffect, type ComponentProps } from "react"
import { CanViewer } from "./CanViewer"

type Props = ComponentProps<typeof CanViewer>

const Fallback = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center ${className ?? ""}`}>
    <div
      className="w-8 h-8 rounded-full animate-pulse"
      style={{
        background: "radial-gradient(circle, rgba(176,0,32,0.8) 0%, rgba(176,0,32,0.1) 70%)",
        boxShadow: "0 0 20px rgba(176,0,32,0.3)",
      }}
    />
  </div>
)

export function LazyCanViewer(props: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <Fallback className={props.className} />
  return <CanViewer {...props} />
}
