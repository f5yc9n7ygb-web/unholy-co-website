export default function Loading() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      aria-label="Loading"
      role="status"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing sigil mark */}
        <div
          className="w-10 h-10 rounded-full animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(176,0,32,0.8) 0%, rgba(176,0,32,0.1) 70%)",
            boxShadow: "0 0 30px rgba(176,0,32,0.4)",
          }}
          aria-hidden="true"
        />
        <span className="text-xs uppercase tracking-[0.35em] text-offwhite/40 font-cinzel">
          Loading
        </span>
      </div>
    </div>
  )
}
