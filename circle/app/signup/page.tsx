"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      setError("Password needs to be at least 8 characters");
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else if (data.session) {
      router.push("/onboarding");
    } else {
      // Email confirmation is switched on for this Supabase project.
      setConfirmSent(true);
    }
    setLoading(false);
  };

  if (confirmSent) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="max-w-sm rounded-[2rem] bg-card p-8 shadow-soft">
          <h1 className="mb-3 font-serif text-3xl font-semibold">
            Check your inbox
          </h1>
          <p className="text-muted">
            We&apos;ve sent a confirmation link to {email}. Once you&apos;ve
            confirmed, sign in and you&apos;re in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block font-semibold text-accent"
          >
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-[2rem] bg-card p-8 shadow-soft">
        <div className="mb-8 text-center">
          <span className="grad-accent mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full font-serif text-xl text-white shadow-softer">
            C
          </span>
          <h1 className="font-serif text-3xl font-semibold">
            Create your Circle
          </h1>
          <p className="mt-2 text-sm text-muted">
            Private by default. Only you ever see what you log.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">
            {error}
          </p>
        )}

        <form onSubmit={handleSignup} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-line bg-cream px-4 py-3.5 text-sm outline-none transition focus:border-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ characters)"
            className="w-full rounded-2xl border border-line bg-cream px-4 py-3.5 text-sm outline-none transition focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="grad-accent w-full rounded-full py-3.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
