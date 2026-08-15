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
    <div className="sticky top-4 z-40 mx-auto w-full max-w-3xl px-4">
      <nav className="glass flex items-center justify-between rounded-full py-2.5 pl-4 pr-2.5 shadow-soft">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="grad-accent flex h-9 w-9 items-center justify-center rounded-full font-serif text-base text-white">
            C
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight">
            Circle
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={signOut}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:text-ink"
          >
            Sign out
          </button>
          {onLogClick && (
            <button
              onClick={onLogClick}
              className="grad-accent rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-px hover:brightness-105"
            >
              + Log a moment
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
