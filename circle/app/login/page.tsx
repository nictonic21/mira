"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes("Invalid login credentials")) {
        setError("Invalid email or password");
      } else if (authError.message.includes("Email not confirmed")) {
        setError("Please confirm your email first — check your inbox");
      } else {
        setError(authError.message);
      }
    } else if (data.user) {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-[2rem] bg-card p-8 shadow-soft">
        <div className="mb-8 text-center">
          <span className="grad-accent mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full font-serif text-xl text-white shadow-softer">
            C
          </span>
          <h1 className="font-serif text-3xl font-semibold">Welcome back</h1>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
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
            placeholder="Password"
            className="w-full rounded-2xl border border-line bg-cream px-4 py-3.5 text-sm outline-none transition focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="grad-accent w-full rounded-full py-3.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-accent">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
