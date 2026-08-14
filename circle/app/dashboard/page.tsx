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
          <div className="rounded-3xl bg-card p-8 text-center">
            <h2 className="mb-2 text-lg font-semibold">Your circle is empty</h2>
            <p className="mb-6 text-sm text-muted">
              Add the people you see most, then log a moment after you next see
              them.
            </p>
            <Link
              href="/onboarding"
              className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white"
            >
              Add friends
            </Link>
          </div>
        )}

        {/* Your circle, ranked */}
        {friends.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your circle</h2>
              <button
                onClick={() => setShowAddFriend((v) => !v)}
                className="text-sm text-accent"
              >
                + Add friend
              </button>
            </div>

            {showAddFriend && (
              <form
                onSubmit={addFriend}
                className="mb-4 space-y-3 rounded-2xl bg-card p-4"
              >
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Their name"
                  className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-sm outline-none focus:border-accent"
                />
                <div className="flex flex-wrap gap-2">
                  {RELATIONSHIP_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        newType === t
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-line bg-cream text-muted"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white"
                >
                  Add
                </button>
              </form>
            )}

            <ul className="space-y-2">
              {[...stats]
                .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                .map(({ friend, entries: fe, score }) => (
                  <li key={friend.id}>
                    <Link
                      href={`/friends/${friend.id}`}
                      className="flex items-center gap-4 rounded-2xl bg-card p-4 transition hover:shadow-sm"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft font-medium text-accent">
                        {friend.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{friend.name}</p>
                        <p className="text-xs text-muted">
                          {fe.length === 0
                            ? "No moments logged yet"
                            : score === null
                              ? `${fe.length} of ${MIN_ENTRIES_FOR_SCORE} moments before a score appears`
                              : `${fe.length} moments logged`}
                        </p>
                      </div>
                      {score !== null && (
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                            <div
                              className={`h-full rounded-full ${
                                score >= 65
                                  ? "bg-sage"
                                  : score >= 50
                                    ? "bg-accent"
                                    : "bg-clay"
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-sm font-semibold">
                            {score}
                          </span>
                        </div>
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
            <h2 className="mb-1 text-lg font-semibold">Ones to protect</h2>
            <p className="mb-4 text-sm text-muted">
              These friendships consistently leave you better than they found
              you.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {toProtect.map(({ friend, score }) => (
                <Link
                  key={friend.id}
                  href={`/friends/${friend.id}`}
                  className="rounded-2xl border border-sage-soft bg-sage-soft/60 p-4 transition hover:shadow-sm"
                >
                  <p className="font-medium">{friend.name}</p>
                  <p className="mt-1 text-sm text-sage">
                    ● {score} — feeding you
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Costing you */}
        {costing.length > 0 && (
          <section>
            <h2 className="mb-1 text-lg font-semibold">
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
                  className="rounded-2xl border border-clay-soft bg-clay-soft/60 p-4 transition hover:shadow-sm"
                >
                  <p className="font-medium">{friend.name}</p>
                  <p className="mt-1 text-sm text-clay">
                    ● {score} — costing energy
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Going quiet */}
        {goingQuiet.length > 0 && (
          <section>
            <h2 className="mb-1 text-lg font-semibold">Going quiet</h2>
            <p className="mb-4 text-sm text-muted">
              Nothing logged in over sixty days. Maybe worth a message?
            </p>
            <ul className="space-y-2">
              {goingQuiet.map(({ friend, daysQuiet }) => (
                <li key={friend.id}>
                  <Link
                    href={`/friends/${friend.id}`}
                    className="flex items-center justify-between rounded-2xl bg-card p-4 text-sm transition hover:shadow-sm"
                  >
                    <span className="font-medium">{friend.name}</span>
                    <span className="text-muted">{daysQuiet} days</span>
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
