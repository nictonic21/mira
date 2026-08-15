// Tiny hand-rolled icon set — 1.8px strokes, warm and rounded.
interface IconProps {
  size?: number;
  className?: string;
}

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HeartIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 20.5C7 16.5 3.5 13.2 3.5 9.4 3.5 6.6 5.7 4.5 8.3 4.5c1.5 0 2.9.7 3.7 1.9.8-1.2 2.2-1.9 3.7-1.9 2.6 0 4.8 2.1 4.8 4.9 0 3.8-3.5 7.1-8.5 11.1z" />
    </svg>
  );
}

export function SparkIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3.5c.8 4.4 3.1 6.7 7.5 8.5-4.4 1.8-6.7 4.1-7.5 8.5-.8-4.4-3.1-6.7-7.5-8.5 4.4-1.8 6.7-4.1 7.5-8.5z" />
    </svg>
  );
}

export function MoonIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
    </svg>
  );
}

export function ArrowIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </svg>
  );
}

export function LeafIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 19C5 10 10 5 20 4c-.5 10-5.5 15-14 15h-1zm0 0c2-5 5-8 9-10" />
    </svg>
  );
}

// Decorative four-point sparkle, filled.
export function Twinkle({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12 2c.9 5 3 7.1 8 8-5 .9-7.1 3-8 8-.9-5-3-7.1-8-8 5-.9 7.1-3 8-8z" />
    </svg>
  );
}
