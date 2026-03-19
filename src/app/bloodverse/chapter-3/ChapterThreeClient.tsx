"use client"

import Link from "next/link"
import {
  ChapterProgress,
  ChapterHero,
  Scene,
  InteractiveReveal,
  Dialogue,
  Timestamp,
  Artifact,
  Separator,
  ChapterEnd,
} from "@/components/bloodverse/StoryElements"

export default function ChapterThreeClient() {
  return (
    <div className="min-h-screen bg-black chapter-bg-3">
      <ChapterProgress />

      {/* ── HERO ── */}
      <ChapterHero
        chapterNumber="III"
        title="The Choir of Ash"
        subtitle="The final sip. The first truth. The wall between story and reality breaks."
        timestamp="Dawn &middot; The Highest Point"
      />

      {/* ── THE STORY ── */}
      <div className="pb-8">
        <Scene variant="timestamp">
          <Timestamp time="5:55 AM" location="The Morning After the Feast" />
        </Scene>

        <Scene>
          <p>
            You haven&apos;t slept. Not because you can&apos;t — because you don&apos;t need to.
            That changed after the mirror. Sleep feels like a language you used to speak.
          </p>
        </Scene>

        <Scene>
          <p>
            The city outside your window looks different now. The billboards pulse with sigils only
            you can see. The noise of traffic sounds like breathing. Everything has a heartbeat.
          </p>
        </Scene>

        <Scene>
          <p>
            Your phone glows. The BLOODVERSE app. One message:
          </p>
        </Scene>

        <Scene variant="dialogue">
          <Dialogue>
            The choir gathers at dawn. Bring your can. Bring your voice.
          </Dialogue>
        </Scene>

        <Scene variant="centered">
          <InteractiveReveal prompt="Go to the rooftop">
            <p className="text-lg md:text-xl text-bone/80 leading-relaxed">
              The rooftop is the highest point in the district. You take the stairs because
              the elevator feels wrong — too enclosed, too mechanical. Your body wants to climb.
              To rise.
            </p>
          </InteractiveReveal>
        </Scene>

        <Scene>
          <p>
            The sky is purple-black. Pre-dawn. That fragile hour when the world is deciding
            whether to exist. Sixteen others are already here, standing at the edge, facing east.
          </p>
          <p className="mt-4">
            Seventeen, counting you.
          </p>
        </Scene>

        <Scene>
          <p>
            Nobody says anything. The wind carries the smell of concrete and ozone and something
            older — something like earth after a fever breaks.
          </p>
        </Scene>

        <Scene variant="timestamp">
          <Timestamp time="6:06 AM" location="First Light" />
        </Scene>

        <Scene>
          <p>
            The sun doesn&apos;t rise. It <em className="text-blood/70">bleeds</em>. A red line
            splits the horizon like a wound opening, and for a moment the entire skyline looks
            like a can of BloodThirst — crimson and black and impossible to look away from.
          </p>
        </Scene>

        <Scene variant="dialogue">
          <Dialogue speaker="The person beside you &mdash; eyes like embers">
            We are the first.
          </Dialogue>
        </Scene>

        <Scene>
          <p>
            Seventeen cans rise. The last ones. The sigils on each are different but together they
            form something — a sentence, a map, a frequency. You can almost hear it.
          </p>
        </Scene>

        <Scene variant="centered">
          <InteractiveReveal prompt="Drink the final sip">
            <div className="space-y-6 text-lg md:text-xl text-bone/80 leading-relaxed text-left max-w-2xl mx-auto">
              <p>
                You drink. The last sip of BloodThirst. It tastes different this time. Not copper.
                Not night air. It tastes like the moment before a word is spoken. Like potential.
              </p>
              <p className="text-bone/50 italic">
                Like the breath before a scream or a song — and you can&apos;t tell which
                it&apos;s going to be.
              </p>
            </div>
          </InteractiveReveal>
        </Scene>

        <Scene>
          <p>
            The cans crumble. All seventeen. Not crushed — <em>decomposed</em>. Turning to ash
            in your hands. But the ash doesn&apos;t fall.
          </p>
          <p className="mt-4 text-blood/70 italic">It rises.</p>
        </Scene>

        <Scene>
          <p>
            Against gravity, against reason, against everything you used to believe about the way
            things work. The ash forms letters in the air. Then words. Then a manifesto, written
            in smoke and dawn-light, floating above seventeen people who were strangers a week ago
            and are now something else entirely.
          </p>
        </Scene>

        <Scene variant="artifact">
          <Artifact label="The Ash Manifesto &mdash; Transcribed from Air">
            <div className="space-y-3 text-bone/70">
              <p>We were thirsty.</p>
              <p className="pl-4 border-l border-blood/20">
                Not for water. Not for caffeine. Not for another product
                pretending to be a personality.
              </p>
              <p className="pl-4 border-l border-blood/20">
                We were thirsty for something that cuts through
                the noise. Something that wakes you up at 3&nbsp;AM
                and reminds you that you&apos;re alive. Something
                that doesn&apos;t ask you to be less.
              </p>
              <p className="text-blood font-bold text-base mt-4">This is not a drink.</p>
              <p className="text-blood font-bold text-base">This is a signal.</p>
              <p className="mt-4 text-offwhite/80 italic">
                And now that you&apos;ve read this — you&apos;re part of it too.
              </p>
            </div>
          </Artifact>
        </Scene>

        <Scene>
          <p>
            The ash settles. The sun rises. The city wakes up below you, unaware. Seventeen people
            stand on a rooftop, holding nothing but the memory of something extraordinary.
          </p>
        </Scene>

        <Scene>
          <p>
            You look at your hands. The ash has left a mark — faint, crimson, like a sigil
            pressed into your palm. It will fade. But what it opened won&apos;t.
          </p>
        </Scene>

        <Separator />

        {/* ── FOURTH WALL BREAK ── */}
        <Scene variant="timestamp">
          <Timestamp time="Right Now" location="Wherever You Are" />
        </Scene>

        <Scene>
          <p>
            You&apos;ve been reading. Scrolling. Maybe on a train, maybe at 3&nbsp;AM{" "}
            <span className="text-bone/40">(of course it&apos;s 3&nbsp;AM)</span>,
            maybe killing time between things that feel mandatory.
          </p>
        </Scene>

        <Scene>
          <p>
            But here&apos;s the thing — every ritual starts with attention.
          </p>
          <p className="mt-4 text-blood/70 italic">And you just gave yours.</p>
        </Scene>

        <Scene>
          <p>
            The seventeen were first. The next drop makes more. The QR on the can, the sigil on
            the label — they&apos;re real. This story is the map. The can is the key. And you
            just read the whole thing.
          </p>
        </Scene>

        <Scene variant="dialogue">
          <Dialogue>Welcome to the Bloodverse.</Dialogue>
        </Scene>

        <Scene variant="reveal">
          <p className="text-xl md:text-2xl text-bone/60 leading-relaxed">
            The only question left: are you going to keep scrolling?
            <br />
            <span className="text-blood italic">Or are you going to drink?</span>
          </p>
        </Scene>

        <Separator />

        {/* ── END CARD — different from other chapters ── */}
        <div className="py-16 md:py-24 px-4 text-center space-y-8 max-w-2xl mx-auto">
          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-blood to-transparent" />

          <p className="text-lg md:text-xl text-bone/50 italic leading-relaxed">
            The Bloodverse doesn&apos;t end. It expands.
          </p>
          <p className="text-base text-bone/30">
            Every can. Every drop. Every one of you who reads this and feels something —
            you&apos;re writing Chapter IV.
          </p>

          <div className="pt-8 flex flex-wrap justify-center gap-4">
            <Link href="/bloodverse" className="btn btn-ghost text-sm">
              &larr; The Vault
            </Link>
            <Link href="/bloodthirst" className="btn btn-primary text-sm">
              Get BloodThirst
            </Link>
            <Link href="/#subscribe" className="btn btn-ghost text-sm">
              Join the Circle
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
