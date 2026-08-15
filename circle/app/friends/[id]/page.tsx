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
import Avatar from "../../components/Avatar";
import ScoreRing from "../../components/ScoreRing";
import LogEntryModal from "../../components/LogEntryModal";
import TrendChart from "../../components/TrendChart";
import TagChip from "../../components/TagChip";
import { SparkIcon, Twinkle } from "../../components/Icons";

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
      <main className="mx-auto max-w-3xl space-y-6 px-5 pb-24 pt-10">
        {/* Header */}
        <header className="grad-hero card-edge relative flex items-center gap-5 overflow-hidden rounded-[2rem] p-8 shadow-soft">
          <Twinkle size={18} className="absolute right-24 top-6 text-accent/40" />
          <Twinkle size={12} className="absolute bottom-8 right-44 text-clay/40" />
          <Avatar name={friend.name} size={76} />
          <div className="flex-1">
            <h1 className="font-serif text-4xl font-semibold tracking-tight">
              {friend.name}
            </h1>
            {friend.relationship_type && (
              <p className="mt-2 inline-block rounded-full bg-card/70 px-3 py-1 text-xs font-medium capitalize text-muted">
                {friend.relationship_type}
              </p>
            )}
          </div>
          {score !== null ? (
            <ScoreRing score={score} size={112} strokeWidth={10} glow />
          ) : (
            <p className="max-w-32 text-right text-xs leading-relaxed text-muted">
              {MIN_ENTRIES_FOR_SCORE - entries.length} more{" "}
              {MIN_ENTRIES_FOR_SCORE - entries.length === 1
                ? "moment"
                : "moments"}{" "}
              until their score appears
            </p>
          )}
        </header>

        {/* Trend */}
        <section className="card-edge rounded-[2rem] bg-card p-7 shadow-softer">
          <p className="eyebrow mb-1">Trend</p>
          <h2 className="mb-4 font-serif text-2xl font-semibold">
            The last twelve months
          </h2>
          <TrendChart points={monthlyTrend(entries)} />
        </section>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <section className="card-edge rounded-3xl bg-card p-5 shadow-softer">
            <p className="eyebrow mb-2.5">Effort balance</p>
            {ratio === null ? (
              <p className="text-sm text-muted">Log a moment to see this</p>
            ) : (
              <>
                <div className="mb-2.5 flex h-2.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="grad-accent rounded-full"
                    style={{ width: `${Math.round(ratio * 100)}%` }}
                  />
                </div>
                <p className="text-sm leading-snug">
                  You initiate{" "}
                  <span className="font-serif text-xl font-semibold">
                    {Math.round(ratio * 100)}%
                  </span>{" "}
                  of the time
                </p>
              </>
            )}
          </section>

          <section className="card-edge rounded-3xl bg-card p-5 shadow-softer">
            <p className="eyebrow mb-2.5">Frequency</p>
            <p className="text-sm leading-snug">
              <span className="font-serif text-xl font-semibold">{perMonth}</span>{" "}
              moments a month
            </p>
            {quiet !== null && (
              <p className="mt-1.5 text-sm text-muted">
                Last logged {quiet === 0 ? "today" : `${quiet} days ago`}
              </p>
            )}
          </section>

          <section className="card-edge rounded-3xl bg-card p-5 shadow-softer">
            <p className="eyebrow mb-2.5">Most common</p>
            {tags.length === 0 ? (
              <p className="text-sm text-muted">No tags yet</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(({ tag }) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* AI summary — dark contrast card */}
        <section className="card-plum relative overflow-hidden rounded-[2rem] p-7 shadow-soft">
          <SparkIcon size={18} className="absolute right-7 top-7 text-[#f2a0b4]" />
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-1 !text-[#f2a0b4]">Circle reflects</p>
              <h2 className="font-serif text-2xl font-semibold text-white">
                In plain language
              </h2>
            </div>
            <button
              onClick={reflect}
              disabled={summarising || entries.length === 0}
              className="grad-accent rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-110 disabled:opacity-50"
            >
              {summarising ? "Reflecting…" : summary ? "Refresh" : "Reflect"}
            </button>
          </div>
          {summary ? (
            <p className="leading-relaxed text-[#f7dde5]">{summary}</p>
          ) : (
            <p className="text-sm text-[#dfb2bf]">
              {entries.length === 0
                ? `Log a few moments and Circle can put the pattern with ${friend.name} into words.`
                : "Tap reflect and Circle will put the recent pattern into words."}
            </p>
          )}
        </section>

        {/* Entries — timeline */}
        <section>
          <p className="eyebrow mb-1">History</p>
          <h2 className="mb-5 font-serif text-2xl font-semibold">Moments</h2>
          {entries.length === 0 ? (
            <p className="card-edge rounded-3xl bg-card p-6 text-sm text-muted shadow-softer">
              Nothing here yet. After you next see {friend.name}, take fifteen
              seconds to log it.
            </p>
          ) : (
            <ul className="relative space-y-4 border-l-2 border-dashed border-line pl-6">
              {entries.map((e) => {
                const a = analysisByEntry.get(e.id);
                return (
                  <li key={e.id} className="relative">
                    <span
                      className={`absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-cream ${
                        e.energy_score >= 6
                          ? "bg-sage"
                          : e.energy_score <= 4
                            ? "bg-clay"
                            : "bg-line"
                      }`}
                    />
                    <div className="card-edge rounded-3xl bg-card p-5 text-sm shadow-softer">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted">
                          {new Date(e.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs text-muted">
                          energy {e.energy_score}/10 · {e.effort}
                        </span>
                      </div>
                      {e.tags?.length > 0 && (
                        <div className="mb-1.5 flex flex-wrap gap-1.5">
                          {e.tags.map((t) => (
                            <TagChip key={t} tag={t} size="xs" />
                          ))}
                        </div>
                      )}
                      {e.what_happened && <p>{e.what_happened}</p>}
                      {e.how_i_felt && (
                        <p className="mt-1 text-muted">Felt: {e.how_i_felt}</p>
                      )}
                      {a && (
                        <p className="mt-2.5 border-t border-line pt-2.5 text-xs italic text-muted">
                          ✦ {a.ai_note}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Manage — deletion easy and obvious */}
        <section className="rounded-[2rem] border border-line/70 bg-card/50 p-7">
          <p className="eyebrow mb-1">Housekeeping</p>
          <h2 className="mb-4 font-serif text-2xl font-semibold">Manage</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <button
              onClick={archiveFriend}
              className="rounded-full border border-line bg-card px-5 py-2.5 font-medium text-muted transition hover:text-ink"
            >
              Archive {friend.name}
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-full border border-line bg-card px-5 py-2.5 font-medium text-muted transition hover:border-accent hover:text-accent"
              >
                Delete {friend.name} and all their logs
              </button>
            ) : (
              <button
                onClick={deleteFriend}
                className="grad-accent rounded-full px-5 py-2.5 font-semibold text-white shadow-soft"
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
