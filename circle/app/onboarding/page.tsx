"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requireAuth, supabase } from "../../lib/supabase";
import { RELATIONSHIP_TYPES } from "../../lib/types";
import Avatar from "../components/Avatar";

interface Draft {
  name: string;
  type: string;
}

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("friend");
  const [added, setAdded] = useState<Draft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requireAuth();
  }, []);

  const addFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdded((prev) => [...prev, { name: name.trim(), type }]);
    setName("");
    setType("friend");
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (added.length > 0) {
      const { error: insertError } = await supabase.from("friends").insert(
        added.map((f) => ({
          user_id: user.id,
          name: f.name,
          relationship_type: f.type,
        }))
      );
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 font-serif text-3xl font-semibold">
        Who&apos;s in your circle?
      </h1>
      <p className="mb-8 text-muted">
        Add the people you see or speak to most. You can always add more later.
      </p>

      <form
        onSubmit={addFriend}
        className="mb-4 space-y-3 rounded-[2rem] bg-card p-6 shadow-softer"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Their name"
          className="w-full rounded-2xl border border-line bg-cream px-4 py-3.5 text-sm outline-none transition focus:border-accent"
        />
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIP_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                type === t
                  ? "border-accent bg-accent-soft text-accent-deep"
                  : "border-line bg-cream text-muted hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="submit"
          className="w-full rounded-full border border-accent py-3 text-sm font-semibold text-accent transition hover:bg-accent-soft"
        >
          Add to circle
        </button>
      </form>

      {added.length > 0 && (
        <ul className="mb-6 space-y-2">
          {added.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 text-sm shadow-softer"
            >
              <Avatar name={f.name} size={36} />
              <span className="flex-1">
                <span className="font-semibold">{f.name}</span>{" "}
                <span className="text-muted">· {f.type}</span>
              </span>
              <button
                onClick={() => setAdded((prev) => prev.filter((_, j) => j !== i))}
                className="text-xs text-muted transition hover:text-accent"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mb-3 text-sm text-accent">{error}</p>}

      <button
        onClick={finish}
        disabled={saving}
        className="grad-accent w-full rounded-full py-3.5 font-semibold text-white shadow-soft transition hover:brightness-105 disabled:opacity-50"
      >
        {saving
          ? "Saving…"
          : added.length > 0
            ? `Start with ${added.length} ${added.length === 1 ? "friend" : "friends"}`
            : "Skip for now"}
      </button>
    </main>
  );
}
