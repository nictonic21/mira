"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getUser } from "../../lib/supabase";

export default function Profile() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const u = await getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
    setCheckingAuth(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    
    setSaving(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: "https://mira-app-one.vercel.app/reset-password",
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password reset email sent!" });
    }
    setSaving(false);
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "60px", height: "60px", borderRadius: "20px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "white", fontSize: "24px", fontWeight: 700 }}>M</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white" }}>
      
      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>M</span>
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 500 }}>Profile</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Manage your account</p>
          </div>
        </div>
        
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "24px", height: "24px", color: "rgba(255,255,255,0.6)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        </button>

        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99 }} />
            <div style={{ position: "absolute", top: "70px", right: "20px", backgroundColor: "#0f172a", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", padding: "8px", minWidth: "200px", zIndex: 100, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
              <a href="/" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>MIRA</a>
              <a href="/reflect" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Reflect</a>
              <a href="/reveal" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Reveal</a>
              <a href="/look-back" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Look Back</a>
              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
              <a href="/history" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>History</a>
              <a href="/settings" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Settings</a>
            </div>
          </>
        )}
      </header>

      <main style={{ padding: "20px", maxWidth: "500px", margin: "0 auto", paddingBottom: "40px" }}>
        
        {/* Message Toast */}
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

        {/* Profile Info */}
        <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "24px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "9999px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ color: "white", fontSize: "32px", fontWeight: 600 }}>{user?.email?.[0]?.toUpperCase() || "?"}</span>
          </div>
          <p style={{ color: "white", fontSize: "18px", fontWeight: 500, marginBottom: "4px" }}>{user?.email || "Unknown"}</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Member since {new Date(user?.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
        </section>

        {/* Change Password */}
        <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>CHANGE PASSWORD</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "12px",
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
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "white",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleChangePassword}
              disabled={saving || !newPassword || !confirmPassword}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: newPassword && confirmPassword ? "linear-gradient(135deg, #a855f7, #ec4899)" : "rgba(255,255,255,0.1)",
                color: newPassword && confirmPassword ? "white" : "rgba(255,255,255,0.3)",
                fontSize: "15px",
                fontWeight: 600,
                cursor: newPassword && confirmPassword ? "pointer" : "not-allowed",
              }}
            >
              {saving ? "Updating..." : "Update password"}
            </button>
          </div>
        </section>

        {/* Password Reset Email */}
        <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>FORGOT PASSWORD?</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "16px" }}>We'll send a reset link to your email</p>
          <button
            onClick={handleSendPasswordReset}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid rgba(168,85,247,0.3)",
              backgroundColor: "rgba(168,85,247,0.1)",
              color: "#a855f7",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Send reset email
          </button>
        </section>

        {/* Back to Settings */}
        <a href="/settings" style={{ display: "block", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "14px", textDecoration: "none" }}>← Back to Settings</a>
      </main>
    </div>
  );
}