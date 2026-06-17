"use client"

import dynamic from "next/dynamic"

const DesktopLongScroll = dynamic(
  () => import("./DesktopLongScroll").then((mod) => mod.DesktopLongScroll)
)

const MobileRitual = dynamic(
  () => import("./mobile/MobileRitual").then((mod) => mod.MobileRitual)
)

export function BloodThirstShopClient({
  razorpayKey,
  isMobile,
}: {
  razorpayKey?: string
  isMobile: boolean
}) {
  return isMobile
    ? <MobileRitual razorpayKey={razorpayKey} />
    : <DesktopLongScroll razorpayKey={razorpayKey} />
}
