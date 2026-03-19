"use client"

import {
  ChapterProgress,
  ChapterHero,
  Scene,
  InteractiveReveal,
  Redacted,
  Dialogue,
  Timestamp,
  Artifact,
  Separator,
  ChapterEnd,
} from "@/components/bloodverse/StoryElements"

export default function ChapterTwoClient() {
  return (
    <div className="min-h-screen bg-black chapter-bg-2">
      <ChapterProgress />

      {/* ── HERO ── */}
      <ChapterHero
        chapterNumber="II"
        title="The Feast of Shadows"
        subtitle="They drank. The city screamed. Nobody remembers why."
        timestamp="72 Hours Later &middot; Location: [REDACTED]"
      />

      {/* ── THE STORY ── */}
      <div className="pb-8">
        <Scene variant="timestamp">
          <Timestamp time="72 Hours Later" location="Coordinates Received" />
        </Scene>

        <Scene>
          <p>
            The message arrived at exactly 3:33&nbsp;AM. Of course it did.
          </p>
        </Scene>

        <Scene>
          <p>
            Just coordinates. No context, no name, no RSVP link. Your phone&apos;s map app
            opened on its own, the way it does now — like it&apos;s learned to anticipate you.
          </p>
          <p className="mt-4 text-bone/50 italic">
            Or whatever&apos;s watching through you.
          </p>
        </Scene>

        <Scene variant="centered">
          <InteractiveReveal prompt="Follow the coordinates">
            <p className="text-lg md:text-xl text-bone/80 leading-relaxed">
              The address leads to a warehouse district south of the city. Dead zone. No cell signal,
              no streetlights — just concrete and the kind of quiet that feels deliberate.
              Like something is holding its breath.
            </p>
          </InteractiveReveal>
        </Scene>

        <Scene>
          <p>
            You hear them before you see them. Seventeen heartbeats. You shouldn&apos;t be able
            to hear heartbeats.
          </p>
          <p className="mt-4">
            But since Can #0017, a lot of things have changed.
          </p>
        </Scene>

        <Scene>
          <p>
            The door is open. Inside: a long table. Industrial. Raw concrete. And seventeen people,
            each holding a can of BloodThirst. Each one different. Each one watching you like
            they&apos;ve been waiting.
          </p>
        </Scene>

        <Scene variant="dialogue">
          <Dialogue speaker="Someone at the table">
            So you heard it too.
          </Dialogue>
        </Scene>

        <Scene>
          <p>
            It&apos;s not a question. You take the empty seat. There&apos;s a can in front of you
            — fresh, sealed, colder than the room. The label is different from yours. Same crimson,
            but the sigil has evolved. Branching. Growing.
          </p>
        </Scene>

        <Scene variant="artifact">
          <Artifact label="Feast Manifest &mdash; Document #001">
            <p>GATHERING: #001</p>
            <p>LOCATION: <Redacted>19.0760° N, 72.8777° E</Redacted></p>
            <p>ATTENDEES: 17 (all first-contact verified)</p>
            <p>CANS PRESENT: 17 unique sigil variants</p>
            <p>STATUS: Feast commencing</p>
            <p className="mt-2 border-t border-blood/10 pt-2">
              NOTE: No attendee remembers how they found this place. All report the same dream.
            </p>
          </Artifact>
        </Scene>

        <Scene>
          <p>
            Nobody speaks for a long time. You all just... know. The same dream. The same voice
            from the can. The same three knocks in the chest. The same shadow at the end of the street.
          </p>
        </Scene>

        <Scene variant="timestamp">
          <Timestamp time="11:11 PM" location="The Feast Begins" />
        </Scene>

        <Scene variant="dialogue">
          <Dialogue speaker="A voice from the head of the table">
            Drink.
          </Dialogue>
        </Scene>

        <Scene>
          <p>
            Nobody argues. Seventeen tabs crack open in unison. The sound ricochets off the
            walls like a gunshot choir.
          </p>
        </Scene>

        <Scene variant="centered">
          <InteractiveReveal prompt="Take the sip">
            <p className="text-lg md:text-xl text-bone/80 leading-relaxed">
              The lights die. Not flicker — <em>die</em>. Like the electricity was never real.
              Like the building was always dark and you were the ones projecting light.
            </p>
          </InteractiveReveal>
        </Scene>

        <Scene>
          <p>
            In the darkness, the cans glow. Seventeen crimson heartbeats in the black. The sigils
            on each can project upward — symbols burning in the air above the table like
            constellations being born.
          </p>
        </Scene>

        <Scene>
          <p>
            Symbols bloom on the walls. Not projected.{" "}
            <em className="text-blood/70">Growing.</em> Spreading like veins across the concrete,
            pulsing in rhythm with your collective heartbeat. You&apos;re all breathing in sync.
          </p>
          <p className="mt-4 text-bone/50">
            You didn&apos;t agree to this. It&apos;s just happening.
          </p>
        </Scene>

        <Scene variant="dialogue">
          <Dialogue speaker="The voice &mdash; now coming from everywhere">
            The first sip opened your eyes. The second opens the door.
          </Dialogue>
        </Scene>

        <Separator />

        <Scene>
          <p>
            The wall behind the table splits. Not breaks —{" "}
            <em className="text-blood/60">splits</em>. Clean, precise, like it was always meant
            to open. Behind it: a mirror. Floor to ceiling. In perfect darkness, it shouldn&apos;t
            reflect anything.
          </p>
        </Scene>

        <Scene variant="centered">
          <InteractiveReveal prompt="Look into the mirror">
            <div className="space-y-6 text-lg md:text-xl text-bone/80 leading-relaxed text-left max-w-2xl mx-auto">
              <p>
                But it does. It shows you. Not you-now.{" "}
                <strong className="text-offwhite">You-next.</strong>
              </p>
              <p>
                Older. Sharper. Something in your eyes that wasn&apos;t there before — something
                that looks back at the world the way the world looks at fire. You&apos;re holding
                a can that doesn&apos;t exist yet. A batch that hasn&apos;t dropped. A sigil you&apos;ve
                never seen but somehow recognize.
              </p>
            </div>
          </InteractiveReveal>
        </Scene>

        <Scene>
          <p>
            One by one, each person sees something different. Someone laughs — a sound like
            breaking glass. Someone cries. One person runs. You hear their footsteps fade into
            a distance that shouldn&apos;t exist inside a warehouse.
          </p>
        </Scene>

        <Scene variant="artifact">
          <Artifact label="Recovered Footage &mdash; Camera 3">
            <p>TIMESTAMP: <Redacted>[CORRUPTED]</Redacted></p>
            <p>VISUAL: 17 subjects standing. None appear to be breathing.</p>
            <p>DURATION OF STILLNESS: 4 minutes, 33 seconds.</p>
            <p className="mt-2 border-t border-blood/10 pt-2 text-blood/70">
              NOTE: Playback glitches at 00:03:33. Frame shows{" "}
              <strong className="text-blood">18 figures</strong>. No 18th subject was logged.
            </p>
          </Artifact>
        </Scene>

        <Scene>
          <p>
            The mirror goes dark. The symbols on the walls fade. The lights return — but gentler
            now, warmer, like sunrise through smoke.
          </p>
        </Scene>

        <Scene>
          <p>
            You&apos;re still holding the can. It&apos;s empty. The sigil on its surface has
            changed again. You understand now.
          </p>
        </Scene>

        <Scene variant="reveal">
          <p className="text-xl md:text-2xl text-blood/80 italic leading-relaxed font-cinzel">
            BloodThirst isn&apos;t a drink. It&apos;s a key. And you just turned it.
          </p>
        </Scene>

        <Scene variant="dialogue">
          <Dialogue>The feast is over. The choir begins at dawn.</Dialogue>
        </Scene>

        <Scene>
          <p>
            Your phone buzzes. The BLOODVERSE app. One new notification. A time.
            A rooftop. And three words:
          </p>
        </Scene>

        <Scene variant="reveal">
          <p className="text-3xl md:text-4xl font-cinzel text-blood tracking-wider font-bold">
            BRING YOUR VOICE.
          </p>
        </Scene>

        <Separator />

        <ChapterEnd
          nextChapter={{ number: 3, title: "The Choir of Ash", href: "/bloodverse/chapter-3" }}
          message="The door is open. You can't close it now."
        />
      </div>
    </div>
  )
}
