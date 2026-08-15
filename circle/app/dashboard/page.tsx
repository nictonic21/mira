"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { requireAuth, supabase } from "../../lib/supabase";
import {
  computeScore,
  daysSinceLastEntry,
  effortRatio,
} from "../../lib/scoring";
import {
  Entry,
  EntryAnalysis,
  Friend,
  MIN_ENTRIES_FOR_SCORE,
  RELATIONSHIP_TYPES,
} from "../../lib/types";
import Nav from "../components/Nav";
import Avatar from "../components/Avatar";
import ScoreRing from "../components/ScoreRing";
import LogEntryModal from "../components/LogEntryModal";

interface FriendStats {
  friend: Friend;
  entries: Entry[];
  score: number | null;
  ratio: number | null;
  daysQuiet: number | null;
}

export default function Dashboard() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [analyses, setAnalyses] = useState<EntryAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>("friend");

  const load = useCallback(async () => {
    const user = await requireAuth();
    if (!user) return;

    const [friendsRes, entriesRes, analysesRes] = await Promise.all([
      supabase
        .from("friends")
        .select("*")
        .eq("archived", false)
        .order("created_at"),
      supabase.from("entries").select("*").order("created_at", { ascending: false }),
      supabase.from("entry_analysis").select("*"),
    ]);

    setFriends(friendsRes.data ?? []);
    setEntries(entriesRes.data ?? []);
    setAnalyses(analysesRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("friends").insert({
      user_id: user.id,
      name: newName.trim(),
      relationship_type: newType,
    });
    setNewName("");
    setShowAddFriend(false);
    load();
  };

  const stats: FriendStats[] = friends.map((friend) => {
    const friendEntries = entries.filter((e) => e.friend_id === friend.id);
    return {
      friend,
      entries: friendEntries,
      score: computeScore(friendEntries, analyses),
      ratio: effortRatio(friendEntries),
      daysQuiet: daysSinceLastEntry(friendEntries),
    };
  });

  const scored = stats
    .filter((s) => s.score !== null)
    .sort((a, b) => b.score! - a.score!);
  const toProtect = scored.filter((s) => s.score! >= 65).slice(0, 3);
  const costing = [...scored]
    .reverse()
    .filter((s) => s.score! < 50)
    .slice(0, 3);
  const goingQuiet = stats.filter(
    (s) => s.daysQuiet !== null && s.daysQuiet > 60
  );

  // This month's energised vs drained split.
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recent = entries.filter((e) => e.created_at >= cutoff);
  const energised = recent.filter((e) => e.energy_score >= 6).length;
  const drained = recent.filter((e) => e.energy_score <= 4).length;
  const neutral = recent.length - energised - drained;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        …
      </div>
    );
  }

  return (
    <>
      <Nav onLogClick={() => setShowLog(true)} />
      <main className="mx-auto max-w-3xl space-y-10 px-5 py-8 pb-24">
        {/* Empty state */}
        {friends.length === 0 && (
          <div className="grad-hero rounded-[2rem] p-10 text-center shadow-soft">
            <h2 className="mb-2 font-serif text-2xl font-semibold">
              Your circle is empty
            </h2>
            <p className="mx-auto mb-7 max-w-sm text-muted">
              Add the people you see most, then log a moment after you next see
              them.
            </p>
            <Link
              href="/onboarding"
              className="grad-accent rounded-full px-7 py-3 font-semibold text-white shadow-soft"
            >
              Add friends
            </Link>
          </div>
        )}

        {/* This month hero */}
        {recent.length > 0 && (
          <section className="grad-hero rounded-[2rem] p-7 shadow-soft">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h1 className="font-serif text-2xl font-semibold">
                  Your month so far
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {recent.length} {recent.length === 1 ? "moment" : "moments"}{" "}
                  across {new Set(recent.map((e) => e.friend_id)).size} people
                </p>
              </div>
              <p className="hidden text-right text-sm text-muted sm:block">
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>

            {/* energised vs drained split */}
            <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
              {energised > 0 && (
                <div
                  className="rounded-full bg-sage"
                  style={{ flex: energised }}
                />
              )}
              {neutral > 0 && (
                <div
                  className="rounded-full bg-card/80"
                  style={{ flex: neutral }}
                />
              )}
              {drained > 0 && (
                <div
                  className="rounded-full bg-clay"
                  style={{ flex: drained }}
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sage" />
                {energised} left you energised
              </span>
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-2 w-2 rounded-full bg-card" />
                {neutral} neutral
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-clay" />
                {drained} left you drained
              </span>
            </div>
          </section>
        )}

        {/* Your circle, ranked */}
        {friends.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl font-semibold">Your circle</h2>
              <button
                onClick={() => setShowAddFriend((v) => !v)}
                className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold text-accent shadow-softer transition hover:border-accent"
              >
                + Add friend
              </button>
            </div>

            {showAddFriend && (
              <form
                onSubmit={addFriend}
                className="mb-4 space-y-3 rounded-3xl bg-card p-5 shadow-softer"
              >
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Their name"
                  className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm outline-none transition focus:border-accent"
                />
                <div className="flex flex-wrap gap-2">
                  {RELATIONSHIP_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                        newType === t
                          ? "border-accent bg-accent-soft text-accent-deep"
                          : "border-line bg-cream text-muted"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="grad-accent rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-soft"
                >
                  Add
                </button>
              </form>
            )}

            <ul className="space-y-3">
              {[...stats]
                .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                .map(({ friend, entries: fe, score }) => (
                  <li key={friend.id}>
                    <Link
                      href={`/friends/${friend.id}`}
                      className="flex items-center gap-4 rounded-3xl bg-card p-4 shadow-softer transition hover:-translate-y-0.5 hover:shadow-soft"
                    >
                      <Avatar name={friend.name} size={48} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{friend.name}</p>
                        <p className="text-xs text-muted">
                          {fe.length === 0
                            ? "No moments logged yet"
                            : score === null
                              ? `${fe.length} of ${MIN_ENTRIES_FOR_SCORE} moments before a score appears`
                              : `${fe.length} moments logged`}
                        </p>
                      </div>
                      {score !== null && (
                        <ScoreRing
                          score={score}
                          size={52}
                          strokeWidth={5}
                          showLabel={false}
                        />
                      )}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {/* Ones to protect */}
        {toProtect.length > 0 && (
          <section>
            <h2 className="mb-1 font-serif text-2xl font-semibold">
              Ones to protect
            </h2>
            <p className="mb-4 text-sm text-muted">
              These friendships consistently leave you better than they found
              you.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {toProtect.map(({ friend, score }) => (
                <Link
                  key={friend.id}
                  href={`/friends/${friend.id}`}
                  className="rounded-3xl bg-sage-soft p-5 shadow-softer transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Avatar name={friend.name} size={40} />
                    <span className="font-serif text-2xl font-semibold text-sage">
                      {score}
                    </span>
                  </div>
                  <p className="font-semibold">{friend.name}</p>
                  <p className="mt-0.5 text-sm text-sage">feeding you</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Costing you */}
        {costing.length > 0 && (
          <section>
            <h2 className="mb-1 font-serif text-2xl font-semibold">
              Taking more than they give
            </h2>
            <p className="mb-4 text-sm text-muted">
              Right now, these ones tend to leave you drained. Just an
              observation — you know the full story.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {costing.map(({ friend, score }) => (
                <Link
                  key={friend.id}
                  href={`/friends/${friend.id}`}
                  className="rounded-3xl bg-clay-soft p-5 shadow-softer transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Avatar name={friend.name} size={40} />
                    <span className="font-serif text-2xl font-semibold text-clay">
                      {score}
                    </span>
                  </div>
                  <p className="font-semibold">{friend.name}</p>
                  <p className="mt-0.5 text-sm text-clay">costing energy</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Going quiet */}
        {goingQuiet.length > 0 && (
          <section>
            <h2 className="mb-1 font-serif text-2xl font-semibold">
              Going quiet
            </h2>
            <p className="mb-4 text-sm text-muted">
              Nothing logged in over sixty days. Maybe worth a message?
            </p>
            <ul className="space-y-3">
              {goingQuiet.map(({ friend, daysQuiet }) => (
                <li key={friend.id}>
                  <Link
                    href={`/friends/${friend.id}`}
                    className="flex items-center gap-4 rounded-3xl bg-card p-4 text-sm shadow-softer transition hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <Avatar name={friend.name} size={40} />
                    <span className="flex-1 font-semibold">{friend.name}</span>
                    <span className="rounded-full bg-cream px-3 py-1 text-xs text-muted">
                      {daysQuiet} days quiet
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {showLog && (
        <LogEntryModal
          friends={friends}
          onClose={() => setShowLog(false)}
          onSaved={() => {
            setShowLog(false);
            load();
          }}
        />
      )}
    </>
  );
}
