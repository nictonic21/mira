// The brand mark: a circle of friends. Gradient orbs orbiting a rose centre,
// used large on the landing page and small in empty states.
export default function CircleMotif({
  size = 160,
  className,
  spin = true,
}: {
  size?: number;
  className?: string;
  spin?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Circle"
    >
      <defs>
        <linearGradient id="m-rose" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f08d9b" />
          <stop offset="55%" stopColor="#de5480" />
          <stop offset="100%" stopColor="#b44f96" />
        </linearGradient>
        <linearGradient id="m-mint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9ed0b5" />
          <stop offset="100%" stopColor="#4f8d72" />
        </linearGradient>
        <linearGradient id="m-lilac" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c9a6dd" />
          <stop offset="100%" stopColor="#9d5bb5" />
        </linearGradient>
        <linearGradient id="m-apricot" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6c690" />
          <stop offset="100%" stopColor="#c4764a" />
        </linearGradient>
        <linearGradient id="m-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4d491" />
          <stop offset="100%" stopColor="#cf9243" />
        </linearGradient>
      </defs>

      {/* dashed orbit */}
      <circle
        cx="100"
        cy="100"
        r="66"
        fill="none"
        stroke="#de5480"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeDasharray="3 7"
        strokeLinecap="round"
      />

      {/* orbiting friends */}
      <g className={spin ? "orbit" : undefined}>
        <circle cx="100" cy="34" r="14" fill="url(#m-mint)" />
        <circle cx="163" cy="119" r="11" fill="url(#m-lilac)" />
        <circle cx="122" cy="161" r="8" fill="url(#m-apricot)" />
        <circle cx="42" cy="136" r="12" fill="url(#m-gold)" />
        <circle cx="46" cy="63" r="7" fill="url(#m-lilac)" />
      </g>

      {/* you, at the centre */}
      <circle cx="100" cy="100" r="34" fill="url(#m-rose)" />
      <text
        x="100"
        y="112"
        textAnchor="middle"
        fontFamily="var(--font-display), Georgia, serif"
        fontSize="38"
        fill="#ffffff"
      >
        C
      </text>

      {/* sparkle */}
      <path
        d="M168 44c1.5 8 4.5 11 12.5 12.5-8 1.5-11 4.5-12.5 12.5-1.5-8-4.5-11-12.5-12.5 8-1.5 11-4.5 12.5-12.5z"
        fill="#de5480"
        opacity="0.7"
      />
    </svg>
  );
}
