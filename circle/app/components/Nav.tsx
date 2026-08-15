"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Nav({ onLogClick }: { onLogClick?: () => void }) {
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-line/60 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="grad-accent flex h-9 w-9 items-center justify-center rounded-full font-serif text-base text-white shadow-softer">
            C
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight">
            Circle
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {onLogClick && (
            <button
              onClick={onLogClick}
              className="grad-accent rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-px hover:brightness-105"
            >
              + Log a moment
            </button>
          )}
          <button
            onClick={signOut}
            className="text-sm text-muted transition hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
