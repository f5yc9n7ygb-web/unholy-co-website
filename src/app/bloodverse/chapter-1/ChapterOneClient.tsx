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

export default function ChapterOneClient() {
  return (
    <div className="min-h-screen bg-black chapter-bg-1">
      <ChapterProgress />

      {/* ── HERO ── */}
      <ChapterHero
        chapterNumber="I"
        title="The Reaper Knocks"
        subtitle="It starts with a knock and ends with you questioning your reflection."
        timestamp="3:33 AM &middot; Mumbai"
      />

      {/* ── THE STORY ── */}
      <div className="pb-8">
        <Scene variant="timestamp">
          <Timestamp time="3:33 AM" location="Mumbai &middot; The Night Everything Changed" />
        </Scene>

        <Scene>
          <p>
            You can&apos;t sleep. It&apos;s that kind of night — the kind where the walls breathe
            and the ceiling has too many patterns. You reach for your phone. Scroll. Doom-scroll.
            And then — an ad. No, not an ad. A summons.
          </p>
        </Scene>

        <Scene>
          <p>
            Black screen. Crimson text. Two words. No price, no reviews, no influencer holding
            it at a flattering angle. Just a button that says{" "}
            <em className="text-blood/70">ORDER.</em> And a line underneath:
          </p>
          <p className="mt-4 text-center text-bone/50 italic">
            &ldquo;Deliveries arrive when you&apos;re ready. You won&apos;t choose the time.&rdquo;
          </p>
        </Scene>

        <Scene>
          <p>
            You tap it. Obviously. Credit card. Confirm. The screen flashes once — crimson — then
            goes dark. No confirmation email. No order number. Just silence.
          </p>
          <p className="mt-4 text-bone/50">You put the phone down and forget about it.</p>
        </Scene>

        <Scene>
          <p>
            Three knocks. Your front door. At 3:33&nbsp;AM.
          </p>
        </Scene>

        <Scene>
          <p>
            No one delivers at 3&nbsp;AM. No one. But you open the door anyway, and there it is —
            a matte black box on the ground. No label, no courier, no footsteps retreating down
            the hall. Just the box. And inside:
          </p>
        </Scene>

        <Scene variant="reveal">
          <p className="text-4xl md:text-6xl font-cinzel text-blood tracking-wider font-bold">
            BLOODTHIRST.
          </p>
        </Scene>

        <Scene>
          <p>
            Crimson label. Black can. Cold — impossibly cold, like it&apos;s been waiting in a
            freezer that doesn&apos;t exist. You look down the corridor both ways.
          </p>
          <p className="mt-4 text-bone/50">Empty. Of course.</p>
        </Scene>

        <Separator />

        <Scene variant="centered">
          <InteractiveReveal prompt="Open the can">
            <p className="text-lg md:text-xl text-bone/80 leading-relaxed">
              Mumbai at 3&nbsp;AM is a different city. The silence through your window hums — not with
              traffic, but with something underneath. Something subterranean and patient. You crack the tab.
            </p>
          </InteractiveReveal>
        </Scene>

        <Scene>
          <p className="italic text-blood/70">
            The hiss isn&apos;t carbonation. It&apos;s a whisper. And it knows your name.
          </p>
        </Scene>

        <Scene variant="dialogue">
          <Dialogue speaker="The Can">
            Finally. Took you long enough.
          </Dialogue>
        </Scene>

        <Scene>
          <p>
            First sip. It tastes like copper and night air and something you forgot you were
            looking for. Cold — colder than the can should be. The streetlight above you flickers.
          </p>
        </Scene>

        <Scene variant="timestamp">
          <Timestamp time="3:37 AM" />
        </Scene>

        <Scene>
          <p>
            Second sip. The shadows on the wall behind you are moving. Not with the wind.{" "}
            <em className="text-bone/50">Against it.</em> Your reflection in the window
            blinks after you do.
          </p>
        </Scene>

        <Scene>
          <p>
            Third sip. The QR code on the can — you&apos;d barely noticed it — is pulsing.
            Faint crimson light, like a heartbeat. Your phone&apos;s camera activates on its own.
          </p>
        </Scene>

        <Scene variant="centered">
          <InteractiveReveal prompt="Scan the code">
            <div className="mt-4">
              <Artifact label="Witness Log &mdash; Recovered">
                <p>SUBJECT: Unknown (assigned handle <span className="text-blood">@NIGHTFEED</span>)</p>
                <p>CAN ID: <span className="text-blood">#0017</span></p>
                <p>TIMESTAMP: 03:33 IST</p>
                <p>STATUS: First contact confirmed</p>
                <p className="mt-2 border-t border-blood/10 pt-2">
                  NOTE: Sigil on can altered post-consumption. Subject{" "}
                  <Redacted>vanished from all records</Redacted> within 48 hours.
                </p>
              </Artifact>
            </div>
          </InteractiveReveal>
        </Scene>

        <Separator />

        <Scene>
          <p>
            Your phone buzzes. An app you never installed.{" "}
            <strong className="text-blood">BLOODVERSE.</strong> One notification:
          </p>
        </Scene>

        <Scene variant="dialogue">
          <Dialogue>Chapter I complete. You&apos;ve been witnessed.</Dialogue>
        </Scene>

        <Scene>
          <p>
            You look up. At the end of the street, where the light doesn&apos;t reach, someone
            is standing. Tall. Still. The streetlight between you and them dies.
          </p>
        </Scene>

        <Scene>
          <p>
            Three knocks. Not on a door. On something inside your chest.
          </p>
        </Scene>

        <Scene variant="reveal">
          <p className="text-xl md:text-2xl text-blood/80 italic leading-relaxed font-cinzel">
            The Reaper doesn&apos;t knock on doors. The Reaper knocks on certainty — on everything
            you thought you knew about what&apos;s real and what&apos;s just thirst.
          </p>
        </Scene>

        <Scene>
          <p>
            You finish the can. It&apos;s empty. But when you shake it, something rattles inside.
            A sound like teeth. Or keys.
          </p>
        </Scene>

        <Scene>
          <p>
            You look at the can one last time. The QR code has changed. New symbol.
            New coordinates. A date <strong className="text-blood/70">72 hours from now.</strong>
          </p>
        </Scene>

        <Separator />

        <ChapterEnd
          message="The can is empty. The story isn't."
          finalMessage="Chapter II — The Feast of Shadows — unlocks with the next drop. Stay thirsty."
        />
      </div>
    </div>
  )
}
