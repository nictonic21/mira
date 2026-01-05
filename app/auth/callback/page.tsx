"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth error:", error);
        router.push("/login?error=auth");
      } else {
        router.push("/");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "60px", height: "60px", borderRadius: "20px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
        <span style={{ color: "white", fontSize: "24px", fontWeight: 700 }}>M</span>
      </div>
      <p style={{ color: "rgba(255,255,255,0.6)" }}>Confirming your account...</p>
    </div>
  );
}
