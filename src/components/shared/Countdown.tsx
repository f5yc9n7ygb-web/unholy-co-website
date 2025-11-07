'use client'
import { useEffect, useState } from 'react'
export function Countdown({ target }: { target: string }) {
  const [time, setTime] = useState<{d:number,h:number,m:number,s:number}>({d:0,h:0,m:0,s:0})
  useEffect(() => {
    const t = new Date(target).getTime()
    const id = setInterval(() => {
      const now = Date.now()
      const diff = Math.max(0, t - now)
      const d = Math.floor(diff / (1000*60*60*24))
      const h = Math.floor(diff / (1000*60*60)) % 24
      const m = Math.floor(diff / (1000*60)) % 60
      const s = Math.floor(diff / 1000) % 60
      setTime({d,h,m,s})
    }, 1000)
    return () => clearInterval(id)
  }, [target])
  return (
    <div className="grid grid-flow-col gap-4 text-center text-bone text-xl">
      <div><div className="text-3xl">{time.d}</div><div>days</div></div>
      <div><div className="text-3xl">{time.h}</div><div>hours</div></div>
      <div><div className="text-3xl">{time.m}</div><div>minutes</div></div>
      <div><div className="text-3xl">{time.s}</div><div>seconds</div></div>
    </div>
  )
}
