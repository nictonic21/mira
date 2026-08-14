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
    <nav className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
            C
          </span>
          <span className="text-lg font-semibold tracking-tight">Circle</span>
        </Link>
        <div className="flex items-center gap-3">
          {onLogClick && (
            <button
              onClick={onLogClick}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              + Log
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
