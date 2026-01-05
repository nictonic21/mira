"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getUser } from "../../lib/supabase";

export default function Settings() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUser();
    const savedVoice = localStorage.getItem("mira-voice");
    if (savedVoice !== null) setVoiceEnabled(savedVoice === "true");
  }, []);

  const loadUser = async () => {
    const u = await getUser();
    setUser(u);
  };

  const toggleVoice = () => {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    localStorage.setItem("mira-voice", String(newValue));
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  const clearData = async () => {
    if (confirm("Are you sure? This will delete all your messages, moods, and dreams.")) {
      setLoading(true);
      await supabase.from("messages").delete().neq("id", 0);
      await supabase.from("moods").delete().neq("id", 0);
      await supabase.from("dreams").delete().neq("id", 0);
      setLoading(false);
      alert("All data cleared");
    }
  };

  const resetOnboarding = () => {
    localStorage.removeItem("mira-onboarded");
    router.push("/onboarding");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white" }}>
      
      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>M</span>
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 500 }}>Settings</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Customize MIRA</p>
          </div>
        </div>
        
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "24px", height: "24px", color: "rgba(255,255,255,0.6)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        </button>

        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99 }} />
            <div style={{ position: "absolute", top: "70px", right: "20px", backgroundColor: "#0f172a", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", padding: "8px", minWidth: "200px", zIndex: 100, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
              <a href="/" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                MIRA
              </a>
              <a href="/reflect" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Reflect
              </a>
              <a href="/reveal" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg>
                Reveal
              </a>
              <a href="/look-back" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                Look Back
              </a>
              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
              <a href="/history" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                History
              </a>
              <a href="/settings" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#a855f7", textDecoration: "none", borderRadius: "10px", backgroundColor: "rgba(168,85,247,0.1)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Settings
              </a>
            </div>
          </>
        )}
      </header>

      <main style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
        
        {/* Account */}
        <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>ACCOUNT</p>
          
          {user ? (
            <div>
              <p style={{ color: "white", fontSize: "15px", marginBottom: "4px" }}>{user.email}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Signed in</p>
            </div>
          ) : (
            <div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "12px" }}>Sign in to sync across devices</p>
              <a href="/login" style={{ display: "inline-block", padding: "12px 24px", background: "linear-gradient(135deg, #a855f7, #ec4899)", borderRadius: "12px", color: "white", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>Sign in</a>
            </div>
          )}
        </section>

        {/* Preferences */}
        <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>PREFERENCES</p>
          
          <button onClick={toggleVoice} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 0", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
            <span style={{ color: "white", fontSize: "15px" }}>Voice responses</span>
            <div style={{ width: "50px", height: "28px", borderRadius: "14px", backgroundColor: voiceEnabled ? "#a855f7" : "rgba(255,255,255,0.1)", position: "relative", transition: "all 0.2s" }}>
              <div style={{ position: "absolute", top: "2px", left: voiceEnabled ? "24px" : "2px", width: "24px", height: "24px", borderRadius: "12px", backgroundColor: "white", transition: "all 0.2s" }} />
            </div>
          </button>

          <button onClick={resetOnboarding} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 0", background: "none", border: "none", cursor: "pointer" }}>
            <span style={{ color: "white", fontSize: "15px" }}>Replay onboarding</span>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px", color: "rgba(255,255,255,0.3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </section>

        {/* Data */}
        <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>DATA</p>
          
          <button onClick={clearData} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 0", background: "none", border: "none", cursor: "pointer" }}>
            <span style={{ color: "#ef4444", fontSize: "15px" }}>Clear all data</span>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px", color: "#ef4444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </button>
        </section>

        {/* Sign Out */}
        {user && (
          <button onClick={handleSignOut} disabled={loading} style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "transparent", color: "rgba(255,255,255,0.6)", fontSize: "15px", cursor: "pointer" }}>
            Sign out
          </button>
        )}

        {/* Version */}
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "12px", marginTop: "32px" }}>MIRA v1.0</p>
      </main>
    </div>
  );
}