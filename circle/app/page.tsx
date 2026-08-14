"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        …
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-white">
        C
      </span>
      <h1 className="mb-3 text-4xl font-semibold tracking-tight">Circle</h1>
      <p className="mb-10 max-w-sm text-muted">
        A private log of your friendships. Notice which ones feed you and which
        ones quietly drain you.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-line bg-card px-6 py-3 text-sm font-medium transition hover:border-accent"
        >
          Sign in
        </Link>
      </div>
      <p className="mt-10 max-w-xs text-xs text-muted">
        Everything you log is private to you. No social layer, no sharing, no
        comparing.
      </p>
    </main>
  );
}
