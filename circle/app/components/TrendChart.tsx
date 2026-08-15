"use client";

import { useState } from "react";
import { MonthPoint } from "../../lib/scoring";

// Twelve-month trend of monthly energy scores. Single series, so no legend —
// the surrounding card title names it. Months without entries leave gaps.
// Smooth curve with a soft gradient wash underneath.

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export default function TrendChart({ points }: { points: MonthPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const width = 640;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 28, left: 34 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const x = (i: number) =>
    pad.left + (points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2);
  const y = (score: number) => pad.top + (1 - score / 100) * innerH;
  const baseline = pad.top + innerH;

  // Consecutive runs of months that have data become separate curves.
  const segments: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  points.forEach((p, i) => {
    if (p.score !== null) {
      current.push({ x: x(i), y: y(p.score) });
    } else if (current.length > 0) {
      segments.push(current);
      current = [];
    }
  });
  if (current.length > 0) segments.push(current);

  const hasData = points.some((p) => p.score !== null);

  if (!hasData) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        The trend line appears once you&apos;ve logged a few months together.
      </p>
    );
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Monthly energy score over the last twelve months"
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d6536d" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#d6536d" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trend-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ea7189" />
            <stop offset="100%" stopColor="#cf4d74" />
          </linearGradient>
        </defs>

        {/* recessive gridlines + y labels */}
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(v)}
              y2={y(v)}
              stroke="#f6ddda"
              strokeWidth="1"
            />
            <text
              x={pad.left - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="11"
              fill="#a97f8b"
            >
              {v}
            </text>
          </g>
        ))}

        {/* month labels */}
        {points.map((p, i) => (
          <text
            key={p.month}
            x={x(i)}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#a97f8b"
          >
            {p.label}
          </text>
        ))}

        {/* gradient wash + smooth line per segment */}
        {segments.map((seg, i) => {
          if (seg.length < 2) return null;
          const line = smoothPath(seg);
          const area = `${line} L ${seg[seg.length - 1].x},${baseline} L ${seg[0].x},${baseline} Z`;
          return (
            <g key={i}>
              <path d={area} fill="url(#trend-fill)" />
              <path
                d={line}
                fill="none"
                stroke="url(#trend-line)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* points + generous hover targets */}
        {points.map((p, i) =>
          p.score === null ? null : (
            <g key={p.month}>
              <circle
                cx={x(i)}
                cy={y(p.score)}
                r={hover === i ? 5.5 : 4}
                fill="#d6536d"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={x(i)}
                cy={y(p.score)}
                r="14"
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          )
        )}
      </svg>

      {hover !== null && points[hover].score !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs shadow-softer"
          style={{
            left: `${(x(hover) / width) * 100}%`,
            top: `${(y(points[hover].score!) / height) * 100 - 16}%`,
          }}
        >
          <span className="font-medium">{points[hover].label}</span>{" "}
          <span className="text-muted">
            {points[hover].score} · {points[hover].count}{" "}
            {points[hover].count === 1 ? "entry" : "entries"}
          </span>
        </div>
      )}
    </div>
  );
}
