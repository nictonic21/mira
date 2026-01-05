"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match" });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password updated! Redirecting..." });
      setTimeout(() => router.push("/"), 2000);
    }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "20px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 40px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "24px", fontWeight: 700 }}>M</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>Reset Password</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Enter your new password</p>
        </div>

        {message && (
          <div style={{ 
            padding: "14px 20px", 
            borderRadius: "12px", 
            marginBottom: "20px",
            backgroundColor: message.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
            border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: message.type === "success" ? "#22c55e" : "#ef4444",
            fontSize: "14px"
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleReset}
            disabled={saving}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              border: "none",
              background: "linear-gradient(135deg, #a855f7, #ec4899)",
              color: "white",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: "8px",
            }}
          >
            {saving ? "Updating..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
}