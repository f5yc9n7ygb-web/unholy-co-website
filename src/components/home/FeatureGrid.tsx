"use client"

import { motion } from "framer-motion"
import { TextScramble } from "@/components/ux/TextScramble"

export function FeatureGrid({ features }: { features: Array<{title: string, body: string}> }) {
  return (
    <motion.div 
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.15 }
        }
      }}
      className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
    >
      {features.map((feature) => (
        <motion.div 
          key={feature.title}
          variants={{
            hidden: { opacity: 0, y: 50, scale: 0.95 },
            show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
          }}
        >
          <article className="glass-panel h-full border border-ash/10 hover:border-blood/30 transition-colors">
            <TextScramble
              text={feature.title}
              as="h3"
              className="text-lg font-semibold text-offwhite"
              triggerOnView
              triggerOnHover
              speed={20}
              revealDelay={35}
            />
            <p className="mt-3 text-sm text-offwhite/70 md:text-base">{feature.body}</p>
          </article>
        </motion.div>
      ))}
    </motion.div>
  )
}
