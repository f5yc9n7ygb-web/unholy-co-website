"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { TiltCard } from "@/components/ux/TiltCard"
import { TextScramble } from "@/components/ux/TextScramble"

const stats = [
  { value: "666", unit: "mg", label: "Mineral Payload" },
  { value: "0", unit: "%", label: "Compromise" },
  { value: "11,000", unit: "ft", label: "Source Elevation" },
  { value: "2", unit: "°C", label: "Serve Temp" },
]

const features = [
  {
    title: "FORGED IN DARKNESS",
    desc: "Himalayan mineral water from volcanic geology, sealed in cold matte-black aluminum. Designed for those who consider 'whatever's available' a personal insult.",
  },
  {
    title: "ZERO COMPROMISE",
    desc: "No sugar. No flavoring. No artificial anything. Just water that spent long enough in ancient mountain rock to know exactly what it is. Nothing more. Try competing with that.",
  },
  {
    title: "TASTE THE SIN",
    desc: "Every other drink in the room is overclaiming. BloodThirst isn't. Ice-cold minerals, zero sugar, zero performance. The most interesting thing you can drink is something honest.",
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

export default function HomeShowcase() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="container mx-auto mb-10 max-w-6xl px-4 md:mb-14">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-[10px] uppercase tracking-[0.4em] text-bone/40 md:text-xs"
        >
          The Arsenal
        </motion.p>
      </div>

      <div className="container mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={cardVariants}
          >
            <TiltCard className="glass-panel p-5 text-center md:p-6">
              <p className="font-cinzel text-2xl font-bold text-offwhite md:text-3xl">
                <TextScramble
                  text={stat.value}
                  as="span"
                  triggerOnView
                  speed={20}
                  revealDelay={35}
                  className="transition-colors duration-300 group-hover:text-blood"
                />
                <span className="ml-0.5 text-sm text-bone/40">{stat.unit}</span>
              </p>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-bone/40 md:text-xs">
                {stat.label}
              </p>
            </TiltCard>
          </motion.div>
        ))}

        <motion.div
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={cardVariants}
          className="col-span-2 md:row-span-2"
        >
          <TiltCard className="glass-panel group relative flex h-[350px] items-center justify-center overflow-hidden sm:h-[400px] md:h-full">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(176,0,32,0.12),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <Image
              src="/can.png"
              alt="BLOODTHIRST"
              width={200}
              height={360}
              className="relative z-10 drop-shadow-[0_0_60px_rgba(176,0,32,0.3)] transition-transform duration-700 group-hover:scale-105"
            />
          </TiltCard>
        </motion.div>

        {features.slice(0, 2).map((feature, i) => (
          <motion.div
            key={feature.title}
            custom={5 + i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={cardVariants}
            className="col-span-2"
          >
            <TiltCard className="glass-panel group h-full p-6 md:p-8">
              <TextScramble
                text={feature.title}
                as="h3"
                triggerOnView
                speed={15}
                revealDelay={30}
                className="mb-3 font-cinzel text-sm font-bold tracking-wider text-offwhite transition-colors duration-300 group-hover:text-blood md:text-base"
              />
              <p className="text-xs leading-relaxed text-bone/50 md:text-sm">
                {feature.desc}
              </p>
            </TiltCard>
          </motion.div>
        ))}

        <motion.div
          custom={7}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={cardVariants}
          className="col-span-2 md:col-span-4"
        >
          <TiltCard className="glass-panel group p-6 md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <TextScramble
                text={features[2].title}
                as="h3"
                triggerOnView
                speed={15}
                revealDelay={30}
                className="font-cinzel text-sm font-bold tracking-wider text-offwhite transition-colors duration-300 group-hover:text-blood md:text-base"
              />
              <p className="text-xs leading-relaxed text-bone/50 md:max-w-md md:text-right md:text-sm">
                {features[2].desc}
              </p>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </section>
  )
}
