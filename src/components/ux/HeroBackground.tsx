export default function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(176,0,32,0.24),transparent_34%),radial-gradient(circle_at_80%_18%,rgba(120,0,18,0.18),transparent_30%),radial-gradient(circle_at_50%_72%,rgba(176,0,32,0.14),transparent_42%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.015)_0%,transparent_30%,transparent_70%,rgba(255,255,255,0.015)_100%)] opacity-70" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.56)_100%)]" />
      <div className="absolute left-[8%] top-[18%] h-56 w-56 rounded-full border border-blood/15 bg-blood/10 blur-3xl" />
      <div className="absolute bottom-[8%] right-[10%] h-72 w-72 rounded-full border border-blood/10 bg-blood/10 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:110px_110px]" />
    </div>
  )
}
