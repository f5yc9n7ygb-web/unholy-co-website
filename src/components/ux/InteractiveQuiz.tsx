"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SubscribeForm } from "@/components/forms/SubscribeForm"
import { TransitionLink } from "@/components/ux/TransitionLink"

type Question = {
  id: string
  text: string
  options: { label: string; score: number }[]
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "What feeds your midnight obsession?",
    options: [
      { label: "Creation. Working while the world sleeps.", score: 1 },
      { label: "Control. Building an empire in the dark.", score: 2 },
      { label: "Chaos. Leaving a permanent mark.", score: 3 },
    ],
  },
  {
    id: "q2",
    text: "Your hydration ritual should feel like...",
    options: [
      { label: "A dark pact with the earth.", score: 1 },
      { label: "A necessary weapon.", score: 2 },
      { label: "An unholy indulgence.", score: 3 },
    ],
  },
  {
    id: "q3",
    text: "Commit to the abyss. How deep?",
    options: [
      { label: "Just a taste. Don't rush me.", score: 1 },
      { label: "I want the whole curse.", score: 2 },
      { label: "Bury me in it.", score: 3 },
    ],
  },
]

export function InteractiveQuiz() {
  const [step, setStep] = useState<number>(-1)
  const [scores, setScores] = useState<number[]>([])
  const [hasYieldedEmail, setHasYieldedEmail] = useState(false)

  // -1: Intro, 0,1,2: Quiz, 3: Email, 4: Result
  
  const handleStart = () => setStep(0)
  
  const handleAnswer = (score: number) => {
    setScores((prev) => [...prev, score])
    setStep((prev) => prev + 1)
  }

  const handleEmailSubmitted = () => {
    setHasYieldedEmail(true)
    setStep(4)
  }

  const getTotalScore = () => scores.reduce((a, b) => a + b, 0)
  
  const getRecommendation = () => {
    const total = getTotalScore()
    if (total <= 4) {
      return { pack: "Starter Ritual (6 Pack)", text: "For the cautious souls dipping their toes into the darkness.", param: "pack6" }
    } else if (total <= 7) {
      return { pack: "Weekend Coven (12 Pack)", text: "The perfect balance to fuel your midnight ascensions.", param: "pack12" }
    } else {
      return { pack: "True Believer (24 Pack)", text: "Complete submission. You require the abyss on tap.", param: "pack24" }
    }
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-2xl border border-white/[0.05] bg-black/40 backdrop-blur-md p-8 md:p-12 shadow-[0_0_80px_rgba(176,0,32,0.1)]">
      {/* Ambient background glow inside the quiz box */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(176,0,32,0.15),transparent_70%)]" />

      <AnimatePresence mode="wait">
        {step === -1 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center relative z-10"
          >
            <span className="mb-4 inline-block font-cinzel text-[10px] font-bold uppercase tracking-[0.4em] text-blood/80">
              Interactive Oracle
            </span>
            <h2 className="mb-6 font-cinzel text-3xl font-black uppercase text-offwhite md:text-5xl">
              Discover Your <span className="text-blood italic">Poison</span>
            </h2>
            <p className="mb-10 max-w-md text-sm leading-relaxed text-bone/60">
              Answer three questions. Surrender to your true nature. We will reveal exactly what your soul requires.
            </p>
            <button
              onClick={handleStart}
              className="btn btn-primary px-10 py-4 text-xs tracking-[0.2em]"
            >
              Begin The Ritual
            </button>
          </motion.div>
        )}

        {step >= 0 && step < QUESTIONS.length && (
          <motion.div
            key={`q${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center relative z-10 w-full"
          >
            <span className="mb-6 font-cinzel text-[10px] font-bold uppercase tracking-[0.3em] text-blood/60">
              Question {step + 1} of {QUESTIONS.length}
            </span>
            <h3 className="mb-10 font-cinzel text-xl font-bold uppercase text-offwhite md:text-3xl max-w-lg leading-tight">
              {QUESTIONS[step].text}
            </h3>
            
            <div className="w-full space-y-4">
              {QUESTIONS[step].options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(option.score)}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-6 py-4 text-sm text-bone/70 transition-all hover:border-blood/40 hover:bg-blood/10 hover:text-offwhite"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="email"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center relative z-10"
          >
            <h3 className="mb-4 font-cinzel text-2xl font-black uppercase text-offwhite">
              The Oracle is <span className="text-blood">Ready</span>
            </h3>
            <p className="mb-8 max-w-md text-sm leading-relaxed text-bone/60">
              Leave your mark below to bind the pact and reveal your cursed prescription. We will also grant you access to the inner circle.
            </p>
            
            <div className="w-full max-w-sm">
              <SubscribeForm
                action="/api/subscribe"
                buttonLabel="Reveal My Poison"
                formClassName="flex flex-col gap-3 w-full"
                inputClassName="w-full rounded-xl border border-white/[0.08] bg-black/50 px-4 py-3 text-sm text-offwhite outline-none transition-all focus:border-blood/60 focus:ring-1 focus:ring-blood/20 text-center"
                buttonClassName="btn btn-primary w-full py-3 text-sm"
                statusClassName="mt-2 text-[11px] text-bone/60"
                onSuccess={handleEmailSubmitted}
              />
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center text-center relative z-10"
          >
            <span className="mb-4 inline-block font-cinzel text-[10px] font-bold uppercase tracking-[0.4em] text-blood/80">
              Your Prescription
            </span>
            <h2 className="mb-4 font-cinzel text-2xl font-black text-offwhite md:text-4xl">
              {getRecommendation().pack}
            </h2>
            <p className="mb-10 max-w-md text-sm leading-relaxed text-bone/60">
              {getRecommendation().text}
            </p>
            <TransitionLink
              href={`/shop?select=${getRecommendation().param}`}
              className="btn btn-primary px-10 py-4 text-sm shadow-[0_0_40px_rgba(176,0,32,0.4)]"
            >
              Claim Your Curse
            </TransitionLink>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
