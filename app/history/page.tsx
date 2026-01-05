"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getUser } from "../../lib/supabase";

export default function History() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<{ date: string; messages: { role: string; content: string; time: string }[] }[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
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
    loadHistory(u.id);
  };

  const loadHistory = async (userId: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (data) {
      const grouped: Record<string, { role: string; content: string; time: string }[]> = {};
      
      data.forEach(msg => {
        const date = new Date(msg.created_at).toLocaleDateString("en-GB", { 
          weekday: "long", 
          day: "numeric", 
          month: "long", 
          year: "numeric" 
        });
        const time = new Date(msg.created_at).toLocaleTimeString("en-GB", { 
          hour: "2-digit", 
          minute: "2-digit" 
        });
        
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push({ role: msg.role, content: msg.content, time });
      });

      const convos = Object.entries(grouped).map(([date, messages]) => ({
        date,
        messages: messages.reverse()
      }));

      setConversations(convos);
      if (convos.length > 0) setExpandedDate(convos[0].date);
    }
    setIsLoading(false);
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
              <a href="/" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>MIRA</a>
              <a href="/reflect" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Reflect</a>
              <a href="/reveal" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Reveal</a>
              <a href="/look-back" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Look Back</a>
              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
              <a href="/history" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#a855f7", textDecoration: "none", borderRadius: "10px", backgroundColor: "rgba(168,85,247,0.1)" }}>History</a>
              <a href="/settings" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Settings</a>
              <a href="/profile" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Profile</a>
            </div>
          </>
        )}
      </header>

      <main style={{ padding: "20px", maxWidth: "500px", margin: "0 auto", paddingBottom: "40px" }}>
        
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "20px", background: "linear-gradient(135deg, #a855f7, #ec4899)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: "24px", fontWeight: 700 }}>M</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading history...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", marginBottom: "16px" }}>No conversations yet</p>
            <a href="/" style={{ display: "inline-block", padding: "14px 24px", borderRadius: "14px", background: "linear-gradient(135deg, #a855f7, #ec4899)", color: "white", textDecoration: "none", fontSize: "15px", fontWeight: 500 }}>Start chatting</a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {conversations.map((convo, i) => (
              <div key={i} style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <button
                  onClick={() => setExpandedDate(expandedDate === convo.date ? null : convo.date)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: "none",
                    border: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <p style={{ color: "white", fontSize: "14px", fontWeight: 500 }}>{convo.date}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "4px" }}>{convo.messages.length} messages</p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      width: "20px",
                      height: "20px",
                      color: "rgba(255,255,255,0.4)",
                      transform: expandedDate === convo.date ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s"
                    }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                
                {expandedDate === convo.date && (
                  <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {convo.messages.map((msg, j) => (
                      <div key={j} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                        <div style={{
                          maxWidth: "85%",
                          padding: "12px 16px",
                          borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          backgroundColor: msg.role === "user" ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)",
                          border: msg.role === "user" ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.05)"
                        }}>
                          <p style={{ fontSize: "14px", lineHeight: 1.5, color: "rgba(255,255,255,0.9)" }}>{msg.content}</p>
                        </div>
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>{msg.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}