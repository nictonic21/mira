"use client";

import { useState } from "react";
import { MonthPoint } from "../../lib/scoring";

// Twelve-month trend of monthly energy scores. Single series, so no legend —
// the surrounding card title names it. Months without entries leave gaps.
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

  // Build line segments across consecutive months that have data.
  const segments: string[] = [];
  let current: string[] = [];
  points.forEach((p, i) => {
    if (p.score !== null) {
      current.push(`${x(i)},${y(p.score)}`);
    } else if (current.length > 0) {
      segments.push(current.join(" "));
      current = [];
    }
  });
  if (current.length > 0) segments.push(current.join(" "));

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
        {/* recessive gridlines + y labels */}
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(v)}
              y2={y(v)}
              stroke="#f4dce7"
              strokeWidth="1"
            />
            <text
              x={pad.left - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="11"
              fill="#a0798e"
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
            fill="#a0798e"
          >
            {p.label}
          </text>
        ))}

        {/* the line */}
        {segments.map((s, i) =>
          s.includes(" ") ? (
            <polyline
              key={i}
              points={s}
              fill="none"
              stroke="#c94f7c"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null
        )}

        {/* points + generous hover targets */}
        {points.map((p, i) =>
          p.score === null ? null : (
            <g key={p.month}>
              <circle
                cx={x(i)}
                cy={y(p.score)}
                r={hover === i ? 5 : 3.5}
                fill="#c94f7c"
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
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs shadow-sm"
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
