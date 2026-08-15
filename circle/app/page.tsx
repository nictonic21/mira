"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import Avatar from "./components/Avatar";
import ScoreRing from "./components/ScoreRing";
import { ArrowIcon, HeartIcon, Twinkle } from "./components/Icons";

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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      {/* Floating preview cards */}
      <div
        className="floaty glass absolute left-[7%] top-[22%] hidden rotate-[-7deg] items-center gap-3 rounded-3xl p-4 shadow-soft lg:flex"
        style={{ "--tilt": "-7deg" } as React.CSSProperties}
      >
        <Avatar name="Sarah" size={44} />
        <div className="text-left">
          <p className="text-sm font-semibold">Sarah</p>
          <p className="text-xs text-sage">feeding you</p>
        </div>
        <ScoreRing score={83} size={48} strokeWidth={5} showLabel={false} />
      </div>
      <div
        className="floaty glass absolute right-[6%] top-[30%] hidden rotate-[6deg] flex-col gap-2 rounded-3xl p-4 shadow-soft lg:flex"
        style={{ "--tilt": "6deg", animationDelay: "1.2s" } as React.CSSProperties}
      >
        <p className="text-left text-xs font-medium text-muted">
          After coffee with Maya
        </p>
        <div className="flex gap-1.5">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-deep">
            laughed
          </span>
          <span className="rounded-full bg-sage-soft px-3 py-1 text-xs font-medium text-sage">
            felt supported
          </span>
        </div>
      </div>
      <div
        className="floaty glass absolute bottom-[32%] left-[6%] hidden rotate-[4deg] items-center gap-2.5 rounded-3xl px-4 py-3 shadow-soft lg:flex"
        style={{ "--tilt": "4deg", animationDelay: "2.4s" } as React.CSSProperties}
      >
        <HeartIcon size={18} className="text-accent" />
        <p className="text-sm font-medium">
          Energy after — <span className="text-sage">Fully energised</span>
        </p>
      </div>

      {/* Sparkles */}
      <Twinkle size={22} className="absolute left-[30%] top-[18%] text-accent/60" />
      <Twinkle size={14} className="absolute right-[28%] top-[14%] text-clay/50" />
      <Twinkle size={16} className="absolute bottom-[24%] right-[16%] text-accent/40" />

      <span className="grad-accent mb-8 flex h-20 w-20 items-center justify-center rounded-full font-serif text-3xl text-white shadow-soft">
        C
      </span>
      <p className="eyebrow mb-4">A private friendship journal</p>
      <h1 className="mb-5 font-serif text-6xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
        Keep the ones
        <br />
        who <em className="text-accent">keep you</em>
      </h1>
      <p className="mb-10 max-w-md text-lg leading-relaxed text-muted">
        Fifteen seconds after you see someone. Over time, Circle shows you
        which friendships feed you — and which ones quietly drain you.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/signup"
          className="grad-accent flex items-center gap-2 rounded-full px-8 py-4 font-semibold text-white shadow-soft transition hover:-translate-y-px hover:brightness-105"
        >
          Start your circle
          <ArrowIcon size={18} />
        </Link>
        <Link
          href="/login"
          className="glass rounded-full px-8 py-4 font-semibold shadow-softer transition hover:-translate-y-px"
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
