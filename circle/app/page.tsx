"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import Avatar from "./components/Avatar";
import ScoreRing from "./components/ScoreRing";
import CircleMotif from "./components/CircleMotif";
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
      <div
        className="floaty glass absolute bottom-[24%] right-[9%] hidden rotate-[-5deg] items-center gap-2.5 rounded-3xl px-4 py-3 shadow-soft lg:flex"
        style={{ "--tilt": "-5deg", animationDelay: "3.4s" } as React.CSSProperties}
      >
        <span className="chip-lilac flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
          62
        </span>
        <p className="text-left text-sm font-medium">
          Alex is going quiet —<br />
          <span className="text-xs text-muted">62 days since you logged</span>
        </p>
      </div>

      {/* Sparkles */}
      <Twinkle size={22} className="absolute left-[30%] top-[16%] text-accent/60" />
      <Twinkle size={14} className="absolute right-[28%] top-[13%] text-violet/50" />
      <Twinkle size={16} className="absolute bottom-[22%] right-[30%] text-clay/50" />
      <Twinkle size={12} className="absolute bottom-[35%] left-[26%] text-accent/40" />

      <CircleMotif size={150} className="mb-4 drop-shadow-lg" />
      <p className="eyebrow mb-4">A private friendship journal</p>
      <h1 className="mb-5 font-serif text-6xl leading-[1.02] tracking-tight sm:text-[5.2rem]">
        Keep the ones
        <br />
        who <em className="text-grad pr-1">keep you</em>
      </h1>
      <p className="mb-10 max-w-lg text-lg leading-relaxed text-muted">
        Fifteen seconds after you see someone. Over time, Circle shows you
        which friendships <span className="highlight-mint text-ink">feed you</span>{" "}
        — and which ones quietly{" "}
        <span className="highlight text-ink">drain you</span>.
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
