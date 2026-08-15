"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Effort, Friend, TAGS } from "../../lib/types";
import { tagPalette } from "./TagChip";

const ENERGY_WORDS = [
  "Completely drained",
  "Drained",
  "Quite drained",
  "A bit drained",
  "Neutral",
  "Okay",
  "A bit lifted",
  "Lifted",
  "Energised",
  "Fully energised",
];

interface Props {
  friends: Friend[];
  defaultFriendId?: string;
  onClose: () => void;
  onSaved: () => void;
}

// Quick log first, deep log behind one tap. The whole quick path should take
// under fifteen seconds.
export default function LogEntryModal({
  friends,
  defaultFriendId,
  onClose,
  onSaved,
}: Props) {
  const [friendId, setFriendId] = useState(defaultFriendId ?? friends[0]?.id ?? "");
  const [energy, setEnergy] = useState(5);
  const [effort, setEffort] = useState<Effort>("mutual");
  const [tags, setTags] = useState<string[]>([]);
  const [showDeep, setShowDeep] = useState(false);
  const [whatHappened, setWhatHappened] = useState("");
  const [howIFelt, setHowIFelt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: string) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const save = async () => {
    if (!friendId) {
      setError("Pick a friend first");
      return;
    }
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You're signed out — sign in again");
      setSaving(false);
      return;
    }

    const { data: entry, error: insertError } = await supabase
      .from("entries")
      .insert({
        friend_id: friendId,
        user_id: user.id,
        energy_score: energy,
        effort,
        tags,
        what_happened: whatHappened.trim() || null,
        how_i_felt: howIFelt.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    // Deep logs get scored by AI in the background; a failure here never
    // blocks the log itself.
    if (entry && (whatHappened.trim() || howIFelt.trim())) {
      try {
        const res = await fetch("/api/score-entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            what_happened: entry.what_happened,
            how_i_felt: entry.how_i_felt,
            energy_score: entry.energy_score,
            effort: entry.effort,
            tags: entry.tags,
          }),
        });
        if (res.ok) {
          const { analysis } = await res.json();
          await supabase.from("entry_analysis").insert({
            entry_id: entry.id,
            sentiment_score: analysis.sentiment_score,
            themes: analysis.themes,
            ai_note: analysis.ai_note,
          });
        }
      } catch {
        // Scoring is best-effort.
      }
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="card-edge max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-card p-7 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="eyebrow mb-1">Fifteen seconds</p>
        <h2 className="mb-6 font-serif text-3xl font-semibold">Log a moment</h2>

        {/* Who */}
        <label className="mb-1.5 block text-sm font-medium text-muted">
          Who did you see?
        </label>
        <select
          value={friendId}
          onChange={(e) => setFriendId(e.target.value)}
          className="mb-6 w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm outline-none transition focus:border-accent"
        >
          {friends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        {/* Energy */}
        <label className="mb-1.5 block text-sm font-medium text-muted">
          Energy after —{" "}
          <span className="font-semibold text-ink">{ENERGY_WORDS[energy - 1]}</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
          className="energy w-full"
        />
        <div className="mb-6 flex justify-between text-xs text-muted">
          <span>Drained</span>
          <span>Energised</span>
        </div>

        {/* Effort */}
        <label className="mb-1.5 block text-sm font-medium text-muted">
          Who made the effort?
        </label>
        <div className="mb-6 grid grid-cols-3 gap-2">
          {(["me", "them", "mutual"] as Effort[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setEffort(opt)}
              className={`rounded-2xl border px-3 py-2.5 text-sm font-medium capitalize transition ${
                effort === opt
                  ? "border-accent bg-accent-soft text-accent-deep"
                  : "border-line bg-cream text-muted hover:text-ink"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Tags */}
        <label className="mb-1.5 block text-sm font-medium text-muted">
          How was it? (optional)
        </label>
        <div className="mb-6 flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const p = tagPalette(tag);
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  active ? "" : "border-line bg-cream hover:text-ink"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: p.bg,
                        color: p.text,
                        borderColor: p.border,
                      }
                    : undefined
                }
              >
                <span className={active ? "" : "text-muted"}>{tag}</span>
              </button>
            );
          })}
        </div>

        {/* Deep log */}
        {!showDeep ? (
          <button
            onClick={() => setShowDeep(true)}
            className="mb-6 text-sm font-semibold text-accent"
          >
            + Go deeper
          </button>
        ) : (
          <div className="mb-6 space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">
                What happened?
              </label>
              <textarea
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm outline-none transition focus:border-accent"
                placeholder="We grabbed coffee and…"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">
                How did you feel after?
              </label>
              <textarea
                value={howIFelt}
                onChange={(e) => setHowIFelt(e.target.value)}
                rows={2}
                className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm outline-none transition focus:border-accent"
                placeholder="Honestly, I felt…"
              />
            </div>
          </div>
        )}

        {error && <p className="mb-3 text-sm text-accent">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-line py-3 text-sm font-medium text-muted transition hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || friends.length === 0}
            className="grad-accent flex-1 rounded-full py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save moment"}
          </button>
        </div>
      </div>
    </div>
  );
}
