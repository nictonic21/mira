"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function History() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [conversations, setConversations] = useState<{ date: string; preview: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("role", "user")
      .order("created_at", { ascending: false });

    if (data) {
      const grouped: Record<string, { messages: any[] }> = {};
      data.forEach((msg) => {
        const date = new Date(msg.created_at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        if (!grouped[date]) grouped[date] = { messages: [] };
        grouped[date].messages.push(msg);
      });

      const convos = Object.entries(grouped).map(([date, { messages }]) => ({
        date,
        preview: messages[0]?.content.slice(0, 80) || "",
        count: messages.length,
      }));

      setConversations(convos);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white" }}>
      
      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>M</span>
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 500 }}>History</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Your conversations</p>
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
              <a href="/history" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#a855f7", textDecoration: "none", borderRadius: "10px", backgroundColor: "rgba(168,85,247,0.1)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                History
              </a>
              <a href="/settings" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Settings
              </a>
            </div>
          </>
        )}
      </header>

      <main style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
        
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "20px", background: "linear-gradient(135deg, #a855f7, #ec4899)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
              <span style={{ color: "white", fontSize: "24px", fontWeight: 700 }}>M</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", marginBottom: "20px" }}>No conversations yet</p>
            <a href="/" style={{ display: "inline-block", padding: "14px 28px", background: "linear-gradient(135deg, #a855f7, #ec4899)", borderRadius: "14px", color: "white", textDecoration: "none", fontSize: "15px", fontWeight: 600 }}>Start chatting</a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {conversations.map((convo, i) => (
              <a href="/" key={i} style={{ display: "block", padding: "16px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", textDecoration: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{convo.date}</p>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", backgroundColor: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "6px" }}>{convo.count} messages</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: 1.5 }}>{convo.preview}...</p>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}