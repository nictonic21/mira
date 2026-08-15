// Circular score out of 100 with a warm gradient arc.
export default function ScoreRing({
  score,
  size = 96,
  strokeWidth = 8,
  showLabel = true,
  track = "#f6ddda",
  glow = false,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  track?: string;
  glow?: boolean;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * c;
  const gradId = `ring-${size}-${strokeWidth}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={
          glow
            ? { filter: "drop-shadow(0 6px 18px rgba(214, 83, 109, 0.4))" }
            : undefined
        }
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ea7189" />
            <stop offset="100%" stopColor="#cf4d74" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-serif font-semibold leading-none"
          style={{ fontSize: size * 0.28 }}
        >
          {score}
        </span>
        {showLabel && size >= 80 && (
          <span className="mt-0.5 text-[10px] uppercase tracking-wide opacity-60">
            of 100
          </span>
        )}
      </div>
    </div>
  );
}
