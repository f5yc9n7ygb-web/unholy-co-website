export function Badges() {
  const badges = [
    "CANNED, 100% RECYCLABLE",
    "ZERO PLASTIC GUILT",
    "MADE IN INDIA",
  ]

  return (
    <div className="flex flex-wrap gap-2 mt-6">
      {badges.map((b, i) => (
        <span
          key={i}
          className="border border-ash text-offwhite/70 px-3 py-1 rounded-full text-xs tracking-wide"
        >
          {b}
        </span>
      ))}
    </div>
  )
}