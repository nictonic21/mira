"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getUser, getUserId } from "../../lib/supabase";

export default function Reflect() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"mood" | "moment" | "dream">("mood");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moment, setMoment] = useState("");
  const [dream, setDream] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [recentMoods, setRecentMoods] = useState<{ mood: string; color: string; date: string }[]>([]);
  const [recentMoments, setRecentMoments] = useState<{ content: string; date: string }[]>([]);
  const [recentDreams, setRecentDreams] = useState<{ text: string; date: string }[]>([]);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  const moods = [
    { name: "Loved", color: "#fb7185" },
    { name: "Happy", color: "#f472b6" },
    { name: "Calm", color: "#c084fc" },
    { name: "Anxious", color: "#a855f7" },
    { name: "Tired", color: "#6366f1" },
    { name: "Sad", color: "#8b5cf6" },
  ];

  const momentPrompts = [
    "What made you smile today?",
    "What's on your mind right now?",
    "What are you grateful for?",
    "What challenged you today?",
    "What do you want to remember about today?",
    "How did you take care of yourself today?",
  ];

  const dreamPrompts = [
    "Where were you in the dream?",
    "Who else was there?",
    "How did it make you feel?",
    "What colours or images stood out?",
    "Did anything strange happen?",
  ];

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
    loadRecentEntries(u.id);
  };

  const loadRecentEntries = async (userId: string) => {
    const { data: moodData } = await supabase.from("moods").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5);
    if (moodData) {
      setRecentMoods(moodData.map(m => ({
        mood: m.mood,
        color: m.color,
        date: formatDate(m.created_at),
      })));
    }

    const { data: msgData } = await supabase.from("messages").select("*").eq("user_id", userId).eq("role", "user").like("content", "[Moment]%").order("created_at", { ascending: false }).limit(3);
    if (msgData) {
      setRecentMoments(msgData.map(m => ({
        content: m.content.replace("[Moment] ", ""),
        date: formatDate(m.created_at),
      })));
    }

    const { data: dreamData } = await supabase.from("dreams").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(3);
    if (dreamData) {
      setRecentDreams(dreamData.map(d => ({
        text: d.dream_text,
        date: formatDate(d.created_at),
      })));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const saveMood = async (mood: string, color: string) => {
    const userId = await getUserId();
    if (!userId) return;
    
    setSelectedMood(mood);
    setSaving(true);
    await supabase.from("moods").insert({ mood, color, user_id: userId });
    setSaving(false);
    setSaved("Mood logged");
    await loadRecentEntries(userId);
    setTimeout(() => {
      setSaved(null);
      setSelectedMood(null);
    }, 2000);
  };

  const saveMoment = async () => {
    if (!moment.trim()) return;
    const userId = await getUserId();
    if (!userId) return;
    
    setSaving(true);
    await supabase.from("messages").insert({ role: "user", content: `[Moment] ${moment}`, user_id: userId });
    setMoment("");
    setSaving(false);
    setSaved("Moment saved");
    await loadRecentEntries(userId);
    setTimeout(() => setSaved(null), 2000);
  };

  const saveDream = async () => {
    if (!dream.trim()) return;
    const userId = await getUserId();
    if (!userId) return;
    
    setSaving(true);
    await supabase.from("dreams").insert({ dream_text: dream, user_id: userId });
    setDream("");
    setSaving(false);
    setSaved("Dream logged");
    await loadRecentEntries(userId);
    setTimeout(() => setSaved(null), 2000);
  };

  const usePrompt = (prompt: string, type: "moment" | "dream") => {
    if (type === "moment") {
      setMoment(moment ? `${moment}\n\n${prompt} ` : `${prompt} `);
    } else {
      setDream(dream ? `${dream}\n\n${prompt} ` : `${prompt} `);
    }
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
      
      {saved && (
        <div style={{ position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#22c55e", color: "white", padding: "14px 28px", borderRadius: "14px", fontSize: "15px", fontWeight: 500, zIndex: 300, boxShadow: "0 10px 40px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          {saved}
        </div>
      )}

      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>M</span>
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 500 }}>Reflect</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Take a moment for yourself</p>
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
              <a href="/reflect" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#a855f7", textDecoration: "none", borderRadius: "10px", backgroundColor: "rgba(168,85,247,0.1)" }}>Reflect</a>
              <a href="/reveal" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Reveal</a>
              <a href="/look-back" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Look Back</a>
              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
              <a href="/history" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>History</a>
              <a href="/settings" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Settings</a>
              <a href="/profile" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Profile</a>
            </div>
          </>
        )}
      </header>

      <main style={{ padding: "20px", maxWidth: "500px", margin: "0 auto", paddingBottom: "40px" }}>
        
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "6px" }}>
          <button onClick={() => setActiveTab("mood")} style={{ flex: 1, padding: "14px 12px", borderRadius: "12px", border: "none", backgroundColor: activeTab === "mood" ? "rgba(168,85,247,0.2)" : "transparent", color: activeTab === "mood" ? "#a855f7" : "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: 500, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", transition: "all 0.2s" }}>
            <span style={{ fontSize: "20px" }}>🎭</span>
            <span>Mood</span>
          </button>
          <button onClick={() => setActiveTab("moment")} style={{ flex: 1, padding: "14px 12px", borderRadius: "12px", border: "none", backgroundColor: activeTab === "moment" ? "rgba(236,72,153,0.2)" : "transparent", color: activeTab === "moment" ? "#ec4899" : "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: 500, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", transition: "all 0.2s" }}>
            <span style={{ fontSize: "20px" }}>✏️</span>
            <span>Moment</span>
          </button>
          <button onClick={() => setActiveTab("dream")} style={{ flex: 1, padding: "14px 12px", borderRadius: "12px", border: "none", backgroundColor: activeTab === "dream" ? "rgba(139,92,246,0.2)" : "transparent", color: activeTab === "dream" ? "#8b5cf6" : "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: 500, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", transition: "all 0.2s" }}>
            <span style={{ fontSize: "20px" }}>🌙</span>
            <span>Dream</span>
          </button>
        </div>

        {activeTab === "mood" && (
          <>
            <section style={{ marginBottom: "32px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textAlign: "center", marginBottom: "20px" }}>How are you feeling right now?</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {moods.map((mood) => (
                  <button
                    key={mood.name}
                    onClick={() => saveMood(mood.name, mood.color)}
                    disabled={saving}
                    style={{
                      padding: "20px 12px",
                      borderRadius: "20px",
                      border: selectedMood === mood.name ? `2px solid ${mood.color}` : "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: selectedMood === mood.name ? `${mood.color}20` : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ position: "relative", width: "52px", height: "52px" }}>
                      <div style={{ position: "absolute", inset: "-8px", borderRadius: "9999px", backgroundColor: mood.color, filter: "blur(16px)", opacity: selectedMood === mood.name ? 0.6 : 0.3 }} />
                      <div style={{ position: "absolute", inset: 0, borderRadius: "9999px", background: `linear-gradient(135deg, ${mood.color}, ${mood.color}bb)`, boxShadow: `0 0 20px ${mood.color}40` }} />
                      <div style={{ position: "absolute", top: "6px", left: "12px", right: "12px", height: "14px", borderRadius: "9999px", background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)" }} />
                    </div>
                    <span style={{ color: mood.color, fontSize: "13px", fontWeight: 500 }}>{mood.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {recentMoods.length > 0 && (
              <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>RECENT MOODS</p>
                <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                  {recentMoods.map((mood, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", minWidth: "60px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "9999px", background: `linear-gradient(135deg, ${mood.color}, ${mood.color}bb)`, boxShadow: `0 0 15px ${mood.color}30` }} />
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", whiteSpace: "nowrap" }}>{mood.date}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === "moment" && (
          <>
            <section style={{ marginBottom: "24px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textAlign: "center", marginBottom: "20px" }}>Capture this moment</p>
              
              <div style={{ position: "relative" }}>
                <textarea
                  value={moment}
                  onChange={(e) => setMoment(e.target.value)}
                  placeholder="What's happening right now? What do you want to remember?"
                  style={{
                    width: "100%",
                    minHeight: "160px",
                    padding: "18px",
                    borderRadius: "20px",
                    border: "1px solid rgba(236,72,153,0.2)",
                    backgroundColor: "rgba(236,72,153,0.05)",
                    color: "white",
                    fontSize: "15px",
                    lineHeight: 1.6,
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ position: "absolute", bottom: "12px", right: "16px", color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>{moment.length}</span>
              </div>

              <button
                onClick={saveMoment}
                disabled={saving || !moment.trim()}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "14px",
                  border: "none",
                  background: moment.trim() ? "linear-gradient(135deg, #ec4899, #f472b6)" : "rgba(255,255,255,0.1)",
                  color: moment.trim() ? "white" : "rgba(255,255,255,0.3)",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: moment.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
              >
                {saving ? "Saving..." : "Save moment"}
              </button>
            </section>

            <section style={{ marginBottom: "24px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "12px" }}>Need inspiration?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {momentPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => usePrompt(prompt, "moment")}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "20px",
                      border: "1px solid rgba(236,72,153,0.2)",
                      backgroundColor: "rgba(236,72,153,0.05)",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </section>

            {recentMoments.length > 0 && (
              <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>RECENT MOMENTS</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {recentMoments.map((m, i) => (
                    <div key={i} style={{ padding: "14px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "12px", borderLeft: "3px solid #ec4899" }}>
                      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: 1.5, marginBottom: "6px" }}>{m.content.slice(0, 100)}{m.content.length > 100 ? "..." : ""}</p>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>{m.date}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === "dream" && (
          <>
            <section style={{ marginBottom: "24px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textAlign: "center", marginBottom: "20px" }}>What did you dream about?</p>
              
              <div style={{ position: "relative" }}>
                <textarea
                  value={dream}
                  onChange={(e) => setDream(e.target.value)}
                  placeholder="Describe your dream... the details, the feelings, the strange parts..."
                  style={{
                    width: "100%",
                    minHeight: "160px",
                    padding: "18px",
                    borderRadius: "20px",
                    border: "1px solid rgba(139,92,246,0.2)",
                    backgroundColor: "rgba(139,92,246,0.05)",
                    color: "white",
                    fontSize: "15px",
                    lineHeight: 1.6,
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ position: "absolute", bottom: "12px", right: "16px", color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>{dream.length}</span>
              </div>

              <button
                onClick={saveDream}
                disabled={saving || !dream.trim()}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "14px",
                  border: "none",
                  background: dream.trim() ? "linear-gradient(135deg, #8b5cf6, #a855f7)" : "rgba(255,255,255,0.1)",
                  color: dream.trim() ? "white" : "rgba(255,255,255,0.3)",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: dream.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
              >
                {saving ? "Saving..." : "Save dream"}
              </button>
            </section>

            <section style={{ marginBottom: "24px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "12px" }}>Try to remember...</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {dreamPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => usePrompt(prompt, "dream")}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "20px",
                      border: "1px solid rgba(139,92,246,0.2)",
                      backgroundColor: "rgba(139,92,246,0.05)",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </section>

            {recentDreams.length > 0 && (
              <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>RECENT DREAMS</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {recentDreams.map((d, i) => (
                    <div key={i} style={{ padding: "14px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "12px", borderLeft: "3px solid #8b5cf6" }}>
                      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: 1.5, marginBottom: "6px" }}>{d.text.slice(0, 100)}{d.text.length > 100 ? "..." : ""}</p>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>{d.date}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}