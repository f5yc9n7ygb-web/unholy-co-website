"use client"

import { ReactNode } from "react"

/**
 * A component that creates a sticky container for its children.
 * The children will remain fixed in the center of the viewport while the user scrolls
 * through the height of the outer container.
 *
 * @param {object} props - The props for the component.
 * @param {ReactNode} props.children - The content to be made sticky.
 * @param {string} [props.height="200vh"] - The total scrollable height of the component.
 * @returns {JSX.Element} The rendered sticky container.
 */
export default function Sticky({ children, height = "200vh" }: { children: ReactNode; height?: string }) {
  return (
    <div style={{ height }}>
      <div className="sticky top-0 h-screen flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}