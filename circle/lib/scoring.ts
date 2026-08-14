import { Entry, EntryAnalysis, MIN_ENTRIES_FOR_SCORE } from "./types";

// How the relationship score works:
//   - energy    (55%): average energy after seeing them, mapped from 1-10 onto 0-100
//   - sentiment (20%): average AI sentiment of deep logs, mapped from -1..1 onto 0-100
//                      (falls back to the energy component when nothing has been analysed)
//   - balance   (25%): how mutual the effort is — 100 when it's even, falling as it
//                      becomes one-sided in either direction
// The score is an observation, not a verdict — copy in the UI must stay warm.

export function effortRatio(entries: Entry[]): number | null {
  if (entries.length === 0) return null;
  const me = entries.filter((e) => e.effort === "me").length;
  const mutual = entries.filter((e) => e.effort === "mutual").length;
  return (me + mutual * 0.5) / entries.length;
}

function energyComponent(entries: Entry[]): number {
  const avg = entries.reduce((s, e) => s + e.energy_score, 0) / entries.length;
  return ((avg - 1) / 9) * 100;
}

export function computeScore(
  entries: Entry[],
  analyses: EntryAnalysis[]
): number | null {
  if (entries.length < MIN_ENTRIES_FOR_SCORE) return null;

  const energy = energyComponent(entries);

  const entryIds = new Set(entries.map((e) => e.id));
  const relevant = analyses.filter((a) => entryIds.has(a.entry_id));
  const sentiment =
    relevant.length > 0
      ? ((relevant.reduce((s, a) => s + a.sentiment_score, 0) / relevant.length + 1) / 2) * 100
      : energy;

  const ratio = effortRatio(entries) ?? 0.5;
  const balance = 100 - Math.min(Math.abs(ratio - 0.5) * 2, 1) * 100;

  return Math.round(energy * 0.55 + sentiment * 0.2 + balance * 0.25);
}

export interface MonthPoint {
  label: string; // e.g. "Sep"
  month: string; // e.g. "2026-09"
  score: number | null; // energy-based monthly score, null when no entries
  count: number;
}

// Last twelve calendar months, oldest first.
export function monthlyTrend(entries: Entry[]): MonthPoint[] {
  const points: MonthPoint[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthEntries = entries.filter((e) => e.created_at.startsWith(month));
    points.push({
      label: d.toLocaleString("en-GB", { month: "short" }),
      month,
      score:
        monthEntries.length > 0
          ? Math.round(energyComponent(monthEntries))
          : null,
      count: monthEntries.length,
    });
  }
  return points;
}

export function topTags(entries: Entry[], limit = 4): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function daysSinceLastEntry(entries: Entry[]): number | null {
  if (entries.length === 0) return null;
  const latest = entries.reduce((max, e) =>
    e.created_at > max.created_at ? e : max
  );
  return Math.floor(
    (Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function entriesPerMonth(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  const oldest = entries.reduce((min, e) =>
    e.created_at < min.created_at ? e : min
  );
  const months = Math.max(
    (Date.now() - new Date(oldest.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30),
    1
  );
  return Math.round((entries.length / months) * 10) / 10;
}
