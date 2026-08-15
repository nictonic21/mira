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
import CircleMotif from "../components/CircleMotif";
import LogEntryModal from "../components/LogEntryModal";
import {
  ArrowIcon,
  HeartIcon,
  MoonIcon,
  SparkIcon,
  Twinkle,
} from "../components/Icons";

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
  const top = scored[0];
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
      <main className="mx-auto max-w-3xl space-y-12 px-5 pb-24 pt-10">
        {/* Empty state */}
        {friends.length === 0 && (
          <div className="grad-hero card-edge relative overflow-hidden rounded-[2rem] p-10 text-center shadow-soft">
            <Twinkle size={20} className="absolute right-8 top-8 text-accent/50" />
            <CircleMotif size={110} className="mx-auto mb-4" />
            <h2 className="mb-2 font-serif text-3xl font-semibold">
              Your circle is empty
            </h2>
            <p className="mx-auto mb-7 max-w-sm text-muted">
              Add the people you see most, then log a moment after you next see
              them.
            </p>
            <Link
              href="/onboarding"
              className="grad-accent inline-flex items-center gap-2 rounded-full px-7 py-3 font-semibold text-white shadow-soft"
            >
              Add friends <ArrowIcon size={16} />
            </Link>
          </div>
        )}

        {/* Bento hero: month + top of circle */}
        {recent.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-5">
            <div className="grad-hero card-edge relative overflow-hidden rounded-[2rem] p-7 shadow-soft sm:col-span-3">
              <Twinkle
                size={16}
                className="absolute right-7 top-7 text-accent/50"
              />
              <p className="eyebrow mb-1.5">This month</p>
              <h1 className="mb-1 font-serif text-4xl">
                <span className="text-grad pr-0.5 font-semibold">
                  {recent.length}
                </span>{" "}
                {recent.length === 1 ? "moment" : "moments"}
              </h1>
              <p className="mb-6 text-sm text-muted">
                across {new Set(recent.map((e) => e.friend_id)).size} people ·{" "}
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}
              </p>

              <div className="flex h-4 gap-1 overflow-hidden rounded-full">
                {energised > 0 && (
                  <div
                    className="rounded-full bg-sage"
                    style={{ flex: energised }}
                  />
                )}
                {neutral > 0 && (
                  <div
                    className="rounded-full bg-card/90"
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
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-sage" />
                  {energised} energised you
                </span>
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full bg-card" />
                  {neutral} neutral
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-clay" />
                  {drained} drained you
                </span>
              </div>
            </div>

            {top && (
              <Link
                href={`/friends/${top.friend.id}`}
                className="card-plum group relative overflow-hidden rounded-[2rem] p-6 shadow-soft transition hover:-translate-y-0.5 sm:col-span-2"
              >
                <SparkIcon
                  size={18}
                  className="absolute right-6 top-6 text-[#f2a0b4]"
                />
                <p className="eyebrow mb-4 !text-[#f2a0b4]">Top of your circle</p>
                <div className="mb-4 flex items-center gap-3">
                  <Avatar name={top.friend.name} size={46} />
                  <div>
                    <p className="font-serif text-xl font-semibold text-white">
                      {top.friend.name}
                    </p>
                    <p className="text-xs text-[#dfb2bf]">
                      feeds you the most right now
                    </p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-serif text-5xl font-semibold text-white">
                    {top.score}
                  </span>
                  <span className="mb-1 flex items-center gap-1 text-xs font-medium text-[#dfb2bf] transition group-hover:text-white">
                    See why <ArrowIcon size={14} />
                  </span>
                </div>
              </Link>
            )}
          </section>
        )}

        {/* Your circle, ranked */}
        {friends.length > 0 && (
          <section>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="eyebrow mb-1">Ranked by energy</p>
                <h2 className="font-serif text-3xl font-semibold">
                  Your circle
                </h2>
              </div>
              <button
                onClick={() => setShowAddFriend((v) => !v)}
                className="glass rounded-full px-4 py-2 text-sm font-semibold text-accent shadow-softer transition hover:-translate-y-px"
              >
                + Add friend
              </button>
            </div>

            {showAddFriend && (
              <form
                onSubmit={addFriend}
                className="card-edge mb-4 space-y-3 rounded-3xl bg-card p-5 shadow-softer"
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
                      className="card-edge group flex items-center gap-4 rounded-3xl bg-card p-4 shadow-softer transition hover:-translate-y-0.5 hover:shadow-soft"
                    >
                      <Avatar name={friend.name} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">{friend.name}</p>
                          {friend.relationship_type && (
                            <span className="hidden rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-medium capitalize text-muted sm:inline">
                              {friend.relationship_type}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {fe.length === 0
                            ? "No moments logged yet"
                            : score === null
                              ? `${fe.length} of ${MIN_ENTRIES_FOR_SCORE} moments before a score appears`
                              : `${fe.length} moments logged`}
                        </p>
                      </div>
                      <ArrowIcon
                        size={16}
                        className="text-line transition group-hover:text-accent"
                      />
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
            <div className="mb-5 flex items-center gap-2.5">
              <span className="chip-mint flex h-9 w-9 items-center justify-center rounded-full shadow-softer">
                <HeartIcon size={17} />
              </span>
              <div>
                <h2 className="font-serif text-3xl font-semibold leading-tight">
                  Ones to protect
                </h2>
              </div>
            </div>
            <p className="-mt-3 mb-4 text-sm text-muted">
              These friendships consistently leave you better than they found
              you.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {toProtect.map(({ friend, score }) => (
                <Link
                  key={friend.id}
                  href={`/friends/${friend.id}`}
                  className="grad-mint card-edge rounded-3xl p-5 shadow-softer transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Avatar name={friend.name} size={40} />
                    <span className="font-serif text-3xl font-semibold text-sage">
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
            <div className="mb-5 flex items-center gap-2.5">
              <span className="chip-apricot flex h-9 w-9 items-center justify-center rounded-full shadow-softer">
                <MoonIcon size={17} />
              </span>
              <h2 className="font-serif text-3xl font-semibold leading-tight">
                Taking more than they give
              </h2>
            </div>
            <p className="-mt-3 mb-4 text-sm text-muted">
              Right now, these ones tend to leave you drained. Just an
              observation — you know the full story.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {costing.map(({ friend, score }) => (
                <Link
                  key={friend.id}
                  href={`/friends/${friend.id}`}
                  className="grad-apricot card-edge rounded-3xl p-5 shadow-softer transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Avatar name={friend.name} size={40} />
                    <span className="font-serif text-3xl font-semibold text-clay">
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
            <div className="mb-5 flex items-center gap-2.5">
              <span className="chip-lilac flex h-9 w-9 items-center justify-center rounded-full shadow-softer">
                <MoonIcon size={17} />
              </span>
              <h2 className="font-serif text-3xl font-semibold leading-tight">
                Going quiet
              </h2>
            </div>
            <p className="-mt-3 mb-4 text-sm text-muted">
              Nothing logged in over sixty days. Maybe worth a message?
            </p>
            <ul className="space-y-3">
              {goingQuiet.map(({ friend, daysQuiet }) => (
                <li key={friend.id}>
                  <Link
                    href={`/friends/${friend.id}`}
                    className="card-edge flex items-center gap-4 rounded-3xl bg-card p-4 text-sm shadow-softer transition hover:-translate-y-0.5 hover:shadow-soft"
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
