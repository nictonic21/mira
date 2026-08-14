"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { requireAuth, supabase } from "../../../lib/supabase";
import {
  computeScore,
  daysSinceLastEntry,
  effortRatio,
  entriesPerMonth,
  monthlyTrend,
  topTags,
} from "../../../lib/scoring";
import {
  Entry,
  EntryAnalysis,
  Friend,
  MIN_ENTRIES_FOR_SCORE,
} from "../../../lib/types";
import Nav from "../../components/Nav";
import LogEntryModal from "../../components/LogEntryModal";
import TrendChart from "../../components/TrendChart";

export default function FriendProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [friend, setFriend] = useState<Friend | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [analyses, setAnalyses] = useState<EntryAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarising, setSummarising] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    const user = await requireAuth();
    if (!user) return;

    const [friendRes, entriesRes] = await Promise.all([
      supabase.from("friends").select("*").eq("id", id).single(),
      supabase
        .from("entries")
        .select("*")
        .eq("friend_id", id)
        .order("created_at", { ascending: false }),
    ]);

    const loadedEntries: Entry[] = entriesRes.data ?? [];
    let loadedAnalyses: EntryAnalysis[] = [];
    if (loadedEntries.length > 0) {
      const { data } = await supabase
        .from("entry_analysis")
        .select("*")
        .in(
          "entry_id",
          loadedEntries.map((e) => e.id)
        );
      loadedAnalyses = data ?? [];
    }

    setFriend(friendRes.data ?? null);
    setEntries(loadedEntries);
    setAnalyses(loadedAnalyses);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const reflect = async () => {
    if (!friend) return;
    setSummarising(true);
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recent = entries.filter((e) => e.created_at >= cutoff);
    const source = recent.length >= 3 ? recent : entries.slice(0, 15);
    try {
      const res = await fetch("/api/friend-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendName: friend.name,
          stats: {
            total_entries_this_year: entries.length,
            initiation_ratio_you: effortRatio(entries),
            avg_energy_after:
              entries.reduce((s, e) => s + e.energy_score, 0) /
              Math.max(entries.length, 1),
          },
          entries: source.map((e) => ({
            date: e.created_at.slice(0, 10),
            energy_after_1_to_10: e.energy_score,
            who_made_the_effort: e.effort,
            tags: e.tags,
            what_happened: e.what_happened,
            how_i_felt: e.how_i_felt,
          })),
        }),
      });
      if (res.ok) {
        const { summary: text } = await res.json();
        setSummary(text);
      } else {
        setSummary("Couldn't write a summary just now — try again in a moment.");
      }
    } catch {
      setSummary("Couldn't write a summary just now — try again in a moment.");
    }
    setSummarising(false);
  };

  const archiveFriend = async () => {
    await supabase.from("friends").update({ archived: true }).eq("id", id);
    router.push("/dashboard");
  };

  const deleteFriend = async () => {
    // Entries and analyses cascade in the schema.
    await supabase.from("friends").delete().eq("id", id);
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        …
      </div>
    );
  }

  if (!friend) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-5 py-16 text-center text-muted">
          This friend doesn&apos;t exist (or was deleted).
        </main>
      </>
    );
  }

  const score = computeScore(entries, analyses);
  const ratio = effortRatio(entries);
  const tags = topTags(entries);
  const quiet = daysSinceLastEntry(entries);
  const perMonth = entriesPerMonth(entries);
  const analysisByEntry = new Map(analyses.map((a) => [a.entry_id, a]));

  return (
    <>
      <Nav onLogClick={() => setShowLog(true)} />
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-8 pb-24">
        {/* Header */}
        <header className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-2xl font-medium text-accent">
            {friend.name.charAt(0).toUpperCase()}
          </span>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{friend.name}</h1>
            {friend.relationship_type && (
              <p className="text-sm capitalize text-muted">
                {friend.relationship_type}
              </p>
            )}
          </div>
          <div className="text-center">
            {score !== null ? (
              <>
                <p className="text-3xl font-semibold">{score}</p>
                <p className="text-xs text-muted">out of 100</p>
              </>
            ) : (
              <p className="max-w-28 text-xs text-muted">
                {MIN_ENTRIES_FOR_SCORE - entries.length} more{" "}
                {MIN_ENTRIES_FOR_SCORE - entries.length === 1
                  ? "moment"
                  : "moments"}{" "}
                until a score appears
              </p>
            )}
          </div>
        </header>

        {/* Trend */}
        <section className="rounded-3xl bg-card p-6">
          <h2 className="mb-4 font-semibold">The last twelve months</h2>
          <TrendChart points={monthlyTrend(entries)} />
        </section>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <section className="rounded-3xl bg-card p-5">
            <h3 className="mb-2 text-sm text-muted">Effort balance</h3>
            {ratio === null ? (
              <p className="text-sm text-muted">Log a moment to see this</p>
            ) : (
              <>
                <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="bg-accent"
                    style={{ width: `${Math.round(ratio * 100)}%` }}
                  />
                </div>
                <p className="text-sm">
                  You initiate{" "}
                  <span className="font-semibold">{Math.round(ratio * 100)}%</span>{" "}
                  of the time
                </p>
              </>
            )}
          </section>

          <section className="rounded-3xl bg-card p-5">
            <h3 className="mb-2 text-sm text-muted">Frequency</h3>
            <p className="text-sm">
              <span className="font-semibold">{perMonth}</span> moments a month
            </p>
            {quiet !== null && (
              <p className="mt-1 text-sm text-muted">
                Last logged {quiet === 0 ? "today" : `${quiet} days ago`}
              </p>
            )}
          </section>

          <section className="rounded-3xl bg-card p-5">
            <h3 className="mb-2 text-sm text-muted">Most common</h3>
            {tags.length === 0 ? (
              <p className="text-sm text-muted">No tags yet</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(({ tag }) => (
                  <span
                    key={tag}
                    className="rounded-full bg-cream px-2.5 py-1 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* AI summary */}
        <section className="rounded-3xl bg-card p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">In plain language</h2>
            <button
              onClick={reflect}
              disabled={summarising || entries.length === 0}
              className="rounded-full border border-accent px-4 py-1.5 text-sm text-accent transition hover:bg-accent-soft disabled:opacity-50"
            >
              {summarising ? "Reflecting…" : summary ? "Refresh" : "Reflect"}
            </button>
          </div>
          {summary ? (
            <p className="text-sm leading-relaxed">{summary}</p>
          ) : (
            <p className="text-sm text-muted">
              {entries.length === 0
                ? "Log a few moments and Circle can put the pattern into words."
                : "Tap reflect and Circle will put the recent pattern into words."}
            </p>
          )}
        </section>

        {/* Entries */}
        <section>
          <h2 className="mb-3 font-semibold">Moments</h2>
          {entries.length === 0 ? (
            <p className="rounded-3xl bg-card p-6 text-sm text-muted">
              Nothing here yet. After you next see {friend.name}, take fifteen
              seconds to log it.
            </p>
          ) : (
            <ul className="space-y-2">
              {entries.map((e) => {
                const a = analysisByEntry.get(e.id);
                return (
                  <li key={e.id} className="rounded-2xl bg-card p-4 text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-muted">
                        {new Date(e.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-xs text-muted">
                        energy {e.energy_score}/10 · effort: {e.effort}
                      </span>
                    </div>
                    {e.tags?.length > 0 && (
                      <div className="mb-1.5 flex flex-wrap gap-1.5">
                        {e.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-cream px-2 py-0.5 text-xs text-muted"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {e.what_happened && <p>{e.what_happened}</p>}
                    {e.how_i_felt && (
                      <p className="mt-1 text-muted">Felt: {e.how_i_felt}</p>
                    )}
                    {a && (
                      <p className="mt-2 border-t border-line pt-2 text-xs italic text-muted">
                        {a.ai_note}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Manage — deletion easy and obvious */}
        <section className="rounded-3xl border border-line p-6">
          <h2 className="mb-3 font-semibold">Manage</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <button
              onClick={archiveFriend}
              className="rounded-xl border border-line px-4 py-2 text-muted transition hover:text-ink"
            >
              Archive {friend.name}
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-xl border border-line px-4 py-2 text-muted transition hover:text-accent"
              >
                Delete {friend.name} and all their logs
              </button>
            ) : (
              <button
                onClick={deleteFriend}
                className="rounded-xl bg-accent px-4 py-2 font-medium text-white"
              >
                Yes, delete everything about {friend.name}
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">
            Deleting removes every moment and analysis for {friend.name},
            permanently. Archiving just tucks them away.
          </p>
        </section>
      </main>

      {showLog && (
        <LogEntryModal
          friends={[friend]}
          defaultFriendId={friend.id}
          onClose={() => setShowLog(false)}
          onSaved={() => {
            setShowLog(false);
            setLoading(true);
            load();
          }}
        />
      )}
    </>
  );
}
