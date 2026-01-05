"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getUser } from "../../lib/supabase";

export default function Settings() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    
    const savedVoice = localStorage.getItem("mira-voice");
    if (savedVoice !== null) setVoiceEnabled(savedVoice === "true");
  };

  const toggleVoice = () => {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    localStorage.setItem("mira-voice", String(newValue));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("mira-onboarded");
    router.push("/login");
  };

  const handleDeleteData = async () => {
    if (!user) return;
    setDeleting(true);
    
    await supabase.from("messages").delete().eq("user_id", user.id);
    await supabase.from("moods").delete().eq("user_id", user.id);
    await supabase.from("dreams").delete().eq("user_id", user.id);
    
    setDeleting(false);
    setShowDeleteConfirm(false);
    alert("All your data has been deleted.");
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "#0f172a", borderRadius: "20px", padding: "24px", maxWidth: "340px", width: "100%", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#ef4444" }}>Delete all data?</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: 1.5, marginBottom: "24px" }}>This will permanently delete all your messages, moods, and dreams. This cannot be undone.</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "transparent", color: "white", fontSize: "14px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDeleteData} disabled={deleting} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#ef4444", color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}

      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>M</span>
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 500 }}>Settings</p>
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
              <a href="/settings" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#a855f7", textDecoration: "none", borderRadius: "10px", backgroundColor: "rgba(168,85,247,0.1)" }}>Settings</a>
            </div>
          </>
        )}
      </header>

      <main style={{ padding: "20px", maxWidth: "500px", margin: "0 auto", paddingBottom: "40px" }}>
        
        {/* Account Section */}
        <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>ACCOUNT</p>
          
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "9999px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: "20px", fontWeight: 600 }}>{user?.email?.[0]?.toUpperCase() || "?"}</span>
            </div>
            <div>
              <p style={{ color: "white", fontSize: "15px", fontWeight: 500 }}>{user?.email || "Unknown"}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Signed in</p>
            </div>
          </div>

          <a href="/profile" style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(168,85,247,0.3)", backgroundColor: "rgba(168,85,247,0.1)", color: "#a855f7", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none", marginBottom: "12px" }}>
  <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "18px", height: "18px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
  Edit Profile
</a>
          <button onClick={handleSignOut} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "transparent", color: "rgba(255,255,255,0.7)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "18px", height: "18px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            Sign out
          </button>
        </section>

        {/* Preferences Section */}
        <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>PREFERENCES</p>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "22px", height: "22px", color: "rgba(255,255,255,0.6)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
              <div>
                <p style={{ color: "white", fontSize: "14px" }}>Voice responses</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>MIRA speaks her replies</p>
              </div>
            </div>
            <button onClick={toggleVoice} style={{ width: "52px", height: "30px", borderRadius: "15px", border: "none", backgroundColor: voiceEnabled ? "#a855f7" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background-color 0.2s" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "12px", backgroundColor: "white", position: "absolute", top: "3px", left: voiceEnabled ? "25px" : "3px", transition: "left 0.2s" }} />
            </button>
          </div>
        </section>

        {/* Data Section */}
        <section style={{ backgroundColor: "rgba(239,68,68,0.1)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>DANGER ZONE</p>
          
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: 1.5, marginBottom: "16px" }}>Delete all your data including messages, moods, and dreams. This action cannot be undone.</p>
          
          <button onClick={() => setShowDeleteConfirm(true)} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #ef4444", backgroundColor: "transparent", color: "#ef4444", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>Delete all my data</button>
        </section>

        {/* App Info */}
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <span style={{ color: "white", fontSize: "18px", fontWeight: 700 }}>M</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>MIRA v1.0</p>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", marginTop: "4px" }}>See yourself clearly</p>
        </div>
      </main>
    </div>
  );
}