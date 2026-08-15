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
      <span className="grad-accent mb-8 flex h-20 w-20 items-center justify-center rounded-full font-serif text-3xl text-white shadow-soft">
        C
      </span>
      <h1 className="mb-4 font-serif text-5xl font-semibold tracking-tight sm:text-6xl">
        Keep the ones
        <br />
        who <em className="text-accent">keep you</em>
      </h1>
      <p className="mb-10 max-w-md text-lg leading-relaxed text-muted">
        Circle is a private log of your friendships. Fifteen seconds after you
        see someone, and over time you&apos;ll see which ones feed you — and
        which ones quietly drain you.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/signup"
          className="grad-accent rounded-full px-8 py-3.5 font-semibold text-white shadow-soft transition hover:-translate-y-px hover:brightness-105"
        >
          Start your circle
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-line bg-card px-8 py-3.5 font-semibold shadow-softer transition hover:-translate-y-px hover:border-accent"
        >
          Sign in
        </Link>
      </div>
      <div className="mt-14 flex items-center gap-2 rounded-full border border-line/70 bg-card/70 px-5 py-2.5 text-sm text-muted shadow-softer">
        <span className="h-2 w-2 rounded-full bg-sage" />
        Private by design — no social layer, no sharing, no comparing
      </div>
    </main>
  );
}
