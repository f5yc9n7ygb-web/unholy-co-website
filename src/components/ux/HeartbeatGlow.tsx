"use client"

/*
  HeartbeatGlow — ambient blood-red radial glow that pulses
  like a heartbeat. Sits behind all content as a fixed layer.
  Pure CSS, zero JS overhead. The page literally breathes.
*/

export function HeartbeatGlow() {
  return (
    <div className="heartbeat-glow" aria-hidden="true">
      <div className="heartbeat-glow-core" />
      <div className="heartbeat-glow-outer" />
    </div>
  )
}
