"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getUser } from "../../lib/supabase";

export default function Reveal() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [people, setPeople] = useState<{ name: string; count: number }[]>([]);
  const [topics, setTopics] = useState<{ name: string; count: number }[]>([]);
  const [moodWeek, setMoodWeek] = useState<{ day: string; mood: string; color: string }[]>([]);
  const [insight, setInsight] = useState("");
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalMoods, setTotalMoods] = useState(0);
  const [totalDreams, setTotalDreams] = useState(0);
  const router = useRouter();

  const moodColors: Record<string, string> = {
    Loved: "#fb7185", Happy: "#f472b6", Calm: "#c084fc",
    Anxious: "#a855f7", Tired: "#6366f1", Sad: "#8b5cf6"
  };

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
    loadData(u.id);
  };

  const loadData = async (userId: string) => {
    setIsLoading(true);
    await Promise.all([
      loadPeople(userId),
      loadTopics(userId),
      loadMoodWeek(userId),
      loadStats(userId),
      loadInsight(userId),
    ]);
    setIsLoading(false);
  };

  const loadPeople = async (userId: string) => {
    const { data } = await supabase.from("messages").select("content").eq("user_id", userId).eq("role", "user");
    if (data) {
      const allText = data.map(m => m.content.toLowerCase()).join(" ");
      const names = ["mum", "mom", "dad", "james", "sarah", "emma", "john", "david", "michael", "brother", "sister", "anna", "kate", "tom", "chris", "boyfriend", "girlfriend", "partner", "boss", "friend"];
      const counts: { name: string; count: number }[] = [];
      names.forEach(name => {
        const count = (allText.match(new RegExp(`\\b${name}\\b`, "gi")) || []).length;
        if (count > 0) counts.push({ name: name.charAt(0).toUpperCase() + name.slice(1), count });
      });
      setPeople(counts.sort((a, b) => b.count - a.count).slice(0, 5));
    }
  };

  const loadTopics = async (userId: string) => {
    const { data } = await supabase.from("messages").select("content").eq("user_id", userId).eq("role", "user");
    if (data) {
      const allText = data.map(m => m.content.toLowerCase()).join(" ");
      const topicList = [
        { name: "Work", keywords: ["work", "job", "boss", "office", "career", "meeting"] },
        { name: "Love", keywords: ["love", "relationship", "partner", "dating", "boyfriend", "girlfriend"] },
        { name: "Family", keywords: ["family", "mum", "dad", "parents", "brother", "sister", "kids"] },
        { name: "Health", keywords: ["health", "tired", "sleep", "exercise", "gym", "sick", "doctor"] },
        { name: "Money", keywords: ["money", "pay", "bills", "afford", "salary", "rent", "savings"] },
        { name: "Future", keywords: ["future", "dream", "goal", "plan", "want", "hope", "wish"] },
        { name: "Stress", keywords: ["stress", "anxious", "worry", "nervous", "overwhelmed", "pressure"] },
        { name: "Friends", keywords: ["friend", "friends", "mate", "mates", "hangout", "social"] },
      ];
      const counts = topicList.map(t => ({
        name: t.name,
        count: t.keywords.reduce((sum, kw) => sum + (allText.match(new RegExp(`\\b${kw}\\b`, "gi")) || []).length, 0)
      })).filter(t => t.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);
      setTopics(counts);
    }
  };

  const loadMoodWeek = async (userId: string) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const weekMoods: { day: string; mood: string; color: string }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const { data } = await supabase.from("moods").select("mood, color").eq("user_id", userId).gte("created_at", dateStr).lte("created_at", dateStr + "T23:59:59").order("created_at", { ascending: false }).limit(1);
      
      weekMoods.push({
        day: days[date.getDay()],
        mood: data?.[0]?.mood || "",
        color: data?.[0]?.color || "rgba(255,255,255,0.1)"
      });
    }
    setMoodWeek(weekMoods);
  };

  const loadStats = async (userId: string) => {
    const { count: msgCount } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("role", "user");
    const { count: moodCount } = await supabase.from("moods").select("*", { count: "exact", head: true }).eq("user_id", userId);
    const { count: dreamCount } = await supabase.from("dreams").select("*", { count: "exact", head: true }).eq("user_id", userId);
    setTotalMessages(msgCount || 0);
    setTotalMoods(moodCount || 0);
    setTotalDreams(dreamCount || 0);
  };

  const loadInsight = async (userId: string) => {
    const { data: msgs } = await supabase.from("messages").select("content").eq("user_id", userId).eq("role", "user").order("created_at", { ascending: false }).limit(20);
    
    if (msgs && msgs.length >= 5) {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: `Based on these recent messages from someone, write ONE short, warm insight (max 2 sentences) about what you notice about them. Be specific and personal, not generic. Messages: ${msgs.map(m => `"${m.content.slice(0, 100)}"`).join(", ")}`
            }]
          }),
        });
        const data = await response.json();
        if (data.message) setInsight(data.message);
      } catch (error) {
        console.error("Error loading insight:", error);
      }
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
      
      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>M</span>
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 500 }}>Reveal</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>What MIRA sees in you</p>
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
              <a href="/reveal" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#a855f7", textDecoration: "none", borderRadius: "10px", backgroundColor: "rgba(168,85,247,0.1)" }}>Reveal</a>
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
        
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "20px", background: "linear-gradient(135deg, #a855f7, #ec4899)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: "24px", fontWeight: 700 }}>M</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Analysing your patterns...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "rgba(168,85,247,0.1)", borderRadius: "16px", padding: "16px", textAlign: "center", border: "1px solid rgba(168,85,247,0.2)" }}>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#a855f7" }}>{totalMessages}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>messages</p>
              </div>
              <div style={{ backgroundColor: "rgba(236,72,153,0.1)", borderRadius: "16px", padding: "16px", textAlign: "center", border: "1px solid rgba(236,72,153,0.2)" }}>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#ec4899" }}>{totalMoods}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>moods</p>
              </div>
              <div style={{ backgroundColor: "rgba(139,92,246,0.1)", borderRadius: "16px", padding: "16px", textAlign: "center", border: "1px solid rgba(139,92,246,0.2)" }}>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#8b5cf6" }}>{totalDreams}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>dreams</p>
              </div>
            </section>

            {/* MIRA's Insight */}
            {insight && (
              <section style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(168,85,247,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>M</span>
                  </div>
                  <p style={{ color: "#a855f7", fontSize: "12px", fontWeight: 600 }}>MIRA'S INSIGHT</p>
                </div>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", lineHeight: 1.6 }}>{insight}</p>
              </section>
            )}

            {/* Mood Week */}
            <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>YOUR WEEK</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {moodWeek.map((day, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "9999px", backgroundColor: day.color, boxShadow: day.mood ? `0 0 15px ${day.color}40` : "none" }} title={day.mood || "No mood"} />
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{day.day}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* People */}
            {people.length > 0 && (
              <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>PEOPLE IN YOUR LIFE</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {people.map((person, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "9999px", background: `linear-gradient(135deg, ${["#ec4899", "#a855f7", "#6366f1", "#8b5cf6", "#f472b6"][i % 5]}, ${["#f472b6", "#c084fc", "#818cf8", "#a78bfa", "#fb7185"][i % 5]})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "white", fontSize: "14px", fontWeight: 600 }}>{person.name[0]}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "white", fontSize: "14px", fontWeight: 500 }}>{person.name}</p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{person.count} mentions</p>
                      </div>
                      <a href={`/?prompt=Tell me about ${person.name}`} style={{ padding: "8px 12px", borderRadius: "8px", backgroundColor: "rgba(168,85,247,0.1)", color: "#a855f7", fontSize: "12px", textDecoration: "none" }}>Talk</a>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Topics */}
            {topics.length > 0 && (
              <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>WHAT'S ON YOUR MIND</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {topics.map((topic, i) => (
                    <div key={i} style={{ padding: "10px 16px", borderRadius: "20px", backgroundColor: `rgba(${[168, 236, 139, 99, 244][i % 5]}, ${[85, 72, 92, 102, 114][i % 5]}, ${[247, 153, 246, 241, 182][i % 5]}, 0.15)`, border: `1px solid rgba(${[168, 236, 139, 99, 244][i % 5]}, ${[85, 72, 92, 102, 241][i % 5]}, ${[247, 153, 246, 241, 182][i % 5]}, 0.3)` }}>
                      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>{topic.name}</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginLeft: "6px" }}>{topic.count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

           {/* Empty state with demo */}
{people.length === 0 && topics.length === 0 && !insight && (
  <>
    <div style={{ textAlign: "center", padding: "20px", marginBottom: "20px" }}>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", marginBottom: "8px" }}>Start chatting to reveal your patterns</p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Here's what it could look like...</p>
    </div>

    {/* Demo Insight */}
    <section style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(168,85,247,0.2)", opacity: 0.6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>M</span>
        </div>
        <p style={{ color: "#a855f7", fontSize: "12px", fontWeight: 600 }}>MIRA'S INSIGHT</p>
        <span style={{ backgroundColor: "rgba(168,85,247,0.2)", color: "#a855f7", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", marginLeft: "auto" }}>Example</span>
      </div>
      <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", lineHeight: 1.6, fontStyle: "italic" }}>"You seem to think about work most on Sunday evenings. There's a pattern of anxiety before the week starts."</p>
    </section>

    {/* Demo Week */}
    <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)", opacity: 0.6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600 }}>YOUR WEEK</p>
        <span style={{ backgroundColor: "rgba(168,85,247,0.2)", color: "#a855f7", fontSize: "10px", padding: "2px 8px", borderRadius: "10px" }}>Example</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "9999px", backgroundColor: ["#f472b6", "#c084fc", "#fb7185", "#a855f7", "#6366f1", "#ec4899", "#8b5cf6"][i], boxShadow: `0 0 15px ${["#f472b6", "#c084fc", "#fb7185", "#a855f7", "#6366f1", "#ec4899", "#8b5cf6"][i]}40` }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{day}</span>
          </div>
        ))}
      </div>
    </section>

    {/* Demo People */}
    <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)", opacity: 0.6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600 }}>PEOPLE IN YOUR LIFE</p>
        <span style={{ backgroundColor: "rgba(168,85,247,0.2)", color: "#a855f7", fontSize: "10px", padding: "2px 8px", borderRadius: "10px" }}>Example</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[{ name: "Mum", count: 23 }, { name: "James", count: 15 }, { name: "Sarah", count: 8 }].map((person, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "9999px", background: `linear-gradient(135deg, ${["#ec4899", "#a855f7", "#6366f1"][i]}, ${["#f472b6", "#c084fc", "#818cf8"][i]})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: "14px", fontWeight: 600 }}>{person.name[0]}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "white", fontSize: "14px", fontWeight: 500 }}>{person.name}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{person.count} mentions</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Demo Topics */}
    <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)", opacity: 0.6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600 }}>WHAT'S ON YOUR MIND</p>
        <span style={{ backgroundColor: "rgba(168,85,247,0.2)", color: "#a855f7", fontSize: "10px", padding: "2px 8px", borderRadius: "10px" }}>Example</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {[{ name: "Work", count: 34 }, { name: "Family", count: 21 }, { name: "Health", count: 12 }, { name: "Future", count: 9 }].map((topic, i) => (
          <div key={i} style={{ padding: "10px 16px", borderRadius: "20px", backgroundColor: `rgba(${[168, 236, 139, 99][i]}, ${[85, 72, 92, 102][i]}, ${[247, 153, 246, 241][i]}, 0.15)`, border: `1px solid rgba(${[168, 236, 139, 99][i]}, ${[85, 72, 92, 102][i]}, ${[247, 153, 246, 241][i]}, 0.3)` }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>{topic.name}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginLeft: "6px" }}>{topic.count}</span>
          </div>
        ))}
      </div>
    </section>

    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <a href="/" style={{ display: "inline-block", padding: "14px 24px", borderRadius: "14px", background: "linear-gradient(135deg, #a855f7, #ec4899)", color: "white", textDecoration: "none", fontSize: "15px", fontWeight: 500 }}>Start chatting</a>
    </div>
  </>
)}