export function Badges() {
  const items = [
    "Canned, 100 percent recyclable",
    "Zero plastic guilt",
    "Made in India"
  ]
  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {items.map((t) => <span key={t} className="badge">{t}</span>)}
    </div>
  )
}
