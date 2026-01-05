"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Reveal() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string; created_at: string }[]>([]);
  const [dreams, setDreams] = useState<{ dream_text: string; created_at: string }[]>([]);
  const [moods, setMoods] = useState<{ mood: string; color: string; created_at: string }[]>([]);
  const [miraSummary, setMiraSummary] = useState("");
  const [miraInsight, setMiraInsight] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [onThisDay, setOnThisDay] = useState<{ content: string; yearsAgo: number }[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const router = useRouter();

  const moodColors: Record<string, string> = { 
    Loved: "#fb7185", Happy: "#f472b6", Calm: "#c084fc", 
    Anxious: "#a855f7", Tired: "#6366f1", Sad: "#8b5cf6" 
  };

  const prompts = [
    "Tell me about your childhood",
    "What decision are you facing?",
    "Who matters most to you?",
    "What's been on your mind lately?",
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const { data: msgData } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    const { data: dreamData } = await supabase.from("dreams").select("*").order("created_at", { ascending: false });
    const { data: moodData } = await supabase.from("moods").select("*").order("created_at", { ascending: false });
    
    if (msgData) setMessages(msgData);
    if (dreamData) setDreams(dreamData);
    if (moodData) setMoods(moodData);

    await loadOnThisDay();
    if (msgData && msgData.length > 5) {
      await getMiraAnalysis(msgData, dreamData || [], moodData || []);
    }
    setIsLoading(false);
  };

  const loadOnThisDay = async () => {
    const today = new Date();
    const memories: { content: string; yearsAgo: number }[] = [];
    for (let yearsAgo = 1; yearsAgo <= 3; yearsAgo++) {
      const pastDate = new Date(today);
      pastDate.setFullYear(pastDate.getFullYear() - yearsAgo);
      const dateStr = pastDate.toISOString().split("T")[0];
      const { data } = await supabase.from("messages").select("*").eq("role", "user").gte("created_at", dateStr).lte("created_at", dateStr + "T23:59:59").limit(1);
      if (data && data.length > 0) memories.push({ content: data[0].content, yearsAgo });
    }
    setOnThisDay(memories);
  };

  const getMiraAnalysis = async (msgs: any[], drms: any[], mds: any[]) => {
    try {
      const userMsgs = msgs.filter(m => m.role === "user").slice(0, 25);
      const msgTexts = userMsgs.map(m => m.content).join(". ");
      const dreamTexts = drms.slice(0, 5).map(d => d.dream_text).join(". ");
      const moodList = mds.slice(0, 14).map(m => `${m.mood} on ${new Date(m.created_at).toLocaleDateString("en-GB", { weekday: "long" })}`).join(", ");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ 
            role: "user", 
            content: `You are MIRA, analysing someone's life patterns deeply.

Their recent messages: "${msgTexts}"
Their dreams: "${dreamTexts}"
Their moods by day: "${moodList}"

Give TWO things in this exact format:

SUMMARY: A warm 2-3 sentence overview of who this person is based on what they share. Start with "From our conversations..." Be personal and caring.

INSIGHT: One specific pattern you notice. Start with "I've noticed..." Be very specific - mention names, days, topics, frequencies. Max 2 sentences.`
          }]
        }),
      });
      const data = await response.json();
      if (data.message) {
        const parts = data.message.split(/INSIGHT:/);
        if (parts[0]) setMiraSummary(parts[0].replace("SUMMARY:", "").trim());
        if (parts[1]) setMiraInsight(parts[1].trim());
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const startChatAbout = (name: string) => {
    setSelectedPerson(null);
    router.push(`/?prompt=Tell me about ${name}`);
  };

  const startChatWithPrompt = (prompt: string) => {
    router.push(`/?prompt=${encodeURIComponent(prompt)}`);
  };

  const userMessages = messages.filter(m => m.role === "user");
  const allText = userMessages.map(m => m.content.toLowerCase()).join(" ");

  const commonNames = ["alice", "andrew", "james", "john", "emma", "sarah", "david", "michael", "chris", "tom", "anna", "kate", "lucy", "sophie", "jack", "harry", "charlie", "george", "oliver", "lily", "grace", "emily", "mum", "mom", "dad", "mother", "father", "brother", "sister"];
  
  const peoplePatterns = commonNames.map(name => {
    const mentions = userMessages.filter(m => m.content.toLowerCase().includes(name));
    const days = mentions.map(m => new Date(m.created_at).toLocaleDateString("en-GB", { weekday: "long" }));
    const dayCounts: Record<string, number> = {};
    days.forEach(d => dayCounts[d] = (dayCounts[d] || 0) + 1);
    const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    const recentMention = mentions[0]?.content.slice(0, 100) || "";
    return { name: name.charAt(0).toUpperCase() + name.slice(1), count: mentions.length, topDay: topDay && topDay[1] >= 2 ? topDay[0] : null, recentContext: recentMention };
  }).filter(p => p.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);

  const topics = [
    { name: "Work", keywords: ["work", "job", "boss", "office", "career", "colleague", "meeting", "project"], color: "#a855f7", emoji: "💼" },
    { name: "Relationships", keywords: ["love", "relationship", "dating", "partner", "boyfriend", "girlfriend", "husband", "wife"], color: "#ec4899", emoji: "💕" },
    { name: "Family", keywords: ["family", "mum", "dad", "mom", "mother", "father", "sister", "brother", "parents"], color: "#f472b6", emoji: "👨‍👩‍👧" },
    { name: "Health", keywords: ["health", "sleep", "tired", "sick", "exercise", "gym", "doctor", "anxiety"], color: "#22c55e", emoji: "🏃" },
    { name: "Money", keywords: ["money", "pay", "afford", "expensive", "salary", "rent", "bills", "buy"], color: "#f59e0b", emoji: "💰" },
    { name: "Dreams", keywords: ["dream", "goal", "want", "wish", "hope", "future", "plan"], color: "#6366f1", emoji: "✨" },
  ].map(topic => ({
    ...topic,
    count: topic.keywords.reduce((sum, kw) => sum + (allText.match(new RegExp(`\\b${kw}\\b`, "gi")) || []).length, 0)
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

  const dreamTexts = dreams.map(d => d.dream_text.toLowerCase()).join(" ");
  const dreamThemes = [
    { name: "Falling", keywords: ["falling", "fall", "dropped"], emoji: "⬇️" },
    { name: "Flying", keywords: ["flying", "fly", "floating", "soaring"], emoji: "🦋" },
    { name: "Being chased", keywords: ["chased", "chasing", "running away", "escape"], emoji: "🏃" },
    { name: "Water", keywords: ["water", "ocean", "sea", "swimming", "drowning"], emoji: "🌊" },
    { name: "Lost", keywords: ["lost", "can't find", "searching"], emoji: "🔍" },
    { name: "Teeth", keywords: ["teeth", "tooth"], emoji: "🦷" },
    { name: "Late", keywords: ["late", "missing", "running out of time"], emoji: "⏰" },
  ].map(theme => ({
    ...theme,
    count: theme.keywords.reduce((sum, kw) => sum + (dreamTexts.match(new RegExp(kw, "gi")) || []).length, 0)
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

  const last7Moods = moods.slice(0, 7);
  const dominantMood = last7Moods.length > 0 
    ? Object.entries(last7Moods.reduce((acc, m) => { acc[m.mood] = (acc[m.mood] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  const progressPercent = Math.min(100, Math.round((userMessages.length * 2 + moods.length * 5 + dreams.length * 10) / 2));
  const hasData = userMessages.length > 0 || moods.length > 0 || dreams.length > 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white" }}>
      
      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>M</span>
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 500 }}>Reveal</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Your life has a pattern</p>
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
              <a href="/reveal" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#a855f7", textDecoration: "none", borderRadius: "10px", backgroundColor: "rgba(168,85,247,0.1)" }}>
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
              <a href="/settings" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Settings
              </a>
            </div>
          </>
        )}
      </header>

      <main style={{ padding: "20px", maxWidth: "500px", margin: "0 auto", paddingBottom: "40px" }}>
        
        {isLoading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "20px", background: "linear-gradient(135deg, #a855f7, #ec4899)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: "24px", fontWeight: 700 }}>M</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>MIRA is finding your patterns...</p>
          </div>
        )}

        {!isLoading && (
          <>
            <section style={{ textAlign: "center", marginBottom: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px" }}>Your Week</p>
              {last7Moods.length > 0 ? (
                <>
                  <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
                    {last7Moods.map((m, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div style={{ position: "relative", width: "40px", height: "40px" }}>
                          <div style={{ position: "absolute", inset: "-6px", borderRadius: "9999px", backgroundColor: m.color, filter: "blur(10px)", opacity: 0.4 }} />
                          <div style={{ position: "absolute", inset: 0, borderRadius: "9999px", background: `linear-gradient(135deg, ${m.color}, ${m.color}bb)`, boxShadow: `0 0 15px ${m.color}40` }} />
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "9px" }}>{new Date(m.created_at).toLocaleDateString("en-GB", { weekday: "short" })}</span>
                      </div>
                    ))}
                  </div>
                  {dominantMood && <p style={{ color: moodColors[dominantMood] || "#a855f7", fontSize: "13px" }}>Mostly feeling {dominantMood.toLowerCase()}</p>}
                </>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
                  {[1,2,3,4,5,6,7].map((_, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.1)" }} />
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "9px" }}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</span>
                    </div>
                  ))}
                </div>
              )}
              {last7Moods.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", fontStyle: "italic" }}>Log moods to see your week</p>}
            </section>

            <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600 }}>HOW WELL MIRA KNOWS YOU</p>
                <p style={{ color: "#a855f7", fontSize: "14px", fontWeight: 600 }}>{progressPercent}%</p>
              </div>
              <div style={{ height: "8px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "9999px", overflow: "hidden", marginBottom: "16px" }}>
                <div style={{ height: "100%", width: `${progressPercent}%`, background: "linear-gradient(90deg, #a855f7, #ec4899)", borderRadius: "9999px" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ textAlign: "center", padding: "12px", backgroundColor: userMessages.length >= 10 ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.02)", borderRadius: "12px", border: userMessages.length >= 10 ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ fontSize: "20px", marginBottom: "4px" }}>{userMessages.length >= 10 ? "✓" : "💬"}</p>
                  <p style={{ color: userMessages.length >= 10 ? "#22c55e" : "rgba(255,255,255,0.5)", fontSize: "11px" }}>10+ chats</p>
                </div>
                <div style={{ textAlign: "center", padding: "12px", backgroundColor: moods.length >= 7 ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.02)", borderRadius: "12px", border: moods.length >= 7 ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ fontSize: "20px", marginBottom: "4px" }}>{moods.length >= 7 ? "✓" : "🎭"}</p>
                  <p style={{ color: moods.length >= 7 ? "#22c55e" : "rgba(255,255,255,0.5)", fontSize: "11px" }}>7+ moods</p>
                </div>
                <div style={{ textAlign: "center", padding: "12px", backgroundColor: dreams.length >= 3 ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.02)", borderRadius: "12px", border: dreams.length >= 3 ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ fontSize: "20px", marginBottom: "4px" }}>{dreams.length >= 3 ? "✓" : "🌙"}</p>
                  <p style={{ color: dreams.length >= 3 ? "#22c55e" : "rgba(255,255,255,0.5)", fontSize: "11px" }}>3+ dreams</p>
                </div>
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "12px" }}>Help MIRA get to know you:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {prompts.map((prompt, i) => (
                  <button key={i} onClick={() => startChatWithPrompt(prompt)} style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(168,85,247,0.2)", backgroundColor: "rgba(168,85,247,0.05)", color: "rgba(255,255,255,0.7)", fontSize: "13px", textAlign: "left", cursor: "pointer" }}>{prompt}</button>
                ))}
              </div>
            </section>

            <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>WHO YOU TALK ABOUT</p>
              {peoplePatterns.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {peoplePatterns.map((person, i) => (
                    <button key={i} onClick={() => setSelectedPerson(person.name)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", width: "100%", padding: "12px", borderRadius: "12px", cursor: "pointer", backgroundColor: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "9999px", background: `linear-gradient(135deg, ${["#fb7185", "#a855f7", "#6366f1", "#22c55e", "#f59e0b", "#ec4899"][i % 6]}, ${["#fb7185", "#a855f7", "#6366f1", "#22c55e", "#f59e0b", "#ec4899"][i % 6]}aa)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "white", fontSize: "18px", fontWeight: 600 }}>{person.name[0]}</span>
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "15px", fontWeight: 500 }}>{person.name}</p>
                          {person.topDay && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>Mostly on {person.topDay}s</p>}
                        </div>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{person.count}x →</span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    {[1,2,3].map((_, i) => (<div key={i} style={{ width: "44px", height: "44px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "rgba(255,255,255,0.2)", fontSize: "16px" }}>?</span></div>))}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", fontStyle: "italic" }}>MIRA will track who you mention</p>
                </>
              )}
            </section>

            <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>WHAT'S ON YOUR MIND</p>
              {topics.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {topics.map((topic, i) => (
                    <div key={i} style={{ padding: "10px 16px", backgroundColor: `${topic.color}15`, borderRadius: "9999px", border: `1px solid ${topic.color}30` }}>
                      <span style={{ color: topic.color, fontSize: "13px" }}>{topic.name} {topic.count}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {["Work", "Love", "Health"].map((t, i) => (<div key={i} style={{ padding: "10px 16px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "9999px", border: "1px dashed rgba(255,255,255,0.1)" }}><span style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>{t}?</span></div>))}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", fontStyle: "italic", marginTop: "12px" }}>Topics will appear here</p>
                </>
              )}
            </section>

            <section style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1))", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(168,85,247,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>M</span>
                </div>
                <span style={{ color: "#a855f7", fontSize: "14px", fontWeight: 600 }}>MIRA'S MIND</span>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginBottom: "8px" }}>WHAT MIRA SEES</p>
                {miraSummary ? <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", lineHeight: 1.7 }}>{miraSummary}</p> : <div style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "14px", border: "1px dashed rgba(255,255,255,0.1)" }}><p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", fontStyle: "italic" }}>After a few conversations, MIRA will share what she notices about you</p></div>}
              </div>
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginBottom: "8px" }}>PATTERN SPOTTED</p>
                {miraInsight ? <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", lineHeight: 1.7 }}>{miraInsight}</p> : <div style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "14px", border: "1px dashed rgba(255,255,255,0.1)" }}><p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", fontStyle: "italic" }}>"You talk about him most on Sunday nights..."</p></div>}
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginBottom: "8px" }}>RECURRING DREAMS</p>
                {dreamThemes.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {dreamThemes.map((theme, i) => (<div key={i} style={{ padding: "8px 14px", backgroundColor: "rgba(139,92,246,0.15)", borderRadius: "9999px", border: "1px solid rgba(139,92,246,0.3)" }}><span style={{ color: "#8b5cf6", fontSize: "12px" }}>{theme.name} {theme.count}x</span></div>))}
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {["Falling?", "Flying?"].map((t, i) => (<div key={i} style={{ padding: "8px 14px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "9999px", border: "1px dashed rgba(255,255,255,0.1)" }}><span style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>{t}</span></div>))}
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", fontStyle: "italic", marginTop: "10px" }}>Log dreams to see themes</p>
                  </>
                )}
              </div>
            </section>

            <section style={{ backgroundColor: "rgba(139,92,246,0.1)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(139,92,246,0.2)" }}>
              <p style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>ON THIS DAY</p>
              {onThisDay.length > 0 ? onThisDay.map((memory, i) => (
                <div key={i} style={{ marginBottom: i < onThisDay.length - 1 ? "16px" : 0 }}>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "6px" }}>{memory.yearsAgo} year{memory.yearsAgo > 1 ? "s" : ""} ago</p>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", lineHeight: 1.5 }}>"{memory.content.slice(0, 120)}{memory.content.length > 120 ? "..." : ""}"</p>
                </div>
              )) : <div style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "14px", border: "1px dashed rgba(255,255,255,0.1)" }}><p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", fontStyle: "italic" }}>In a year, MIRA will remind you what you were thinking today</p></div>}
            </section>

            {!hasData && (
              <div style={{ marginTop: "24px", textAlign: "center" }}>
                <a href="/" style={{ display: "inline-block", padding: "16px 32px", background: "linear-gradient(135deg, #a855f7, #ec4899)", borderRadius: "14px", color: "white", textDecoration: "none", fontSize: "15px", fontWeight: 600 }}>Start chatting with MIRA →</a>
              </div>
            )}
          </>
        )}
      </main>

      {selectedPerson && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }} onClick={() => setSelectedPerson(null)}>
          <div style={{ backgroundColor: "#0f172a", borderRadius: "24px 24px 0 0", padding: "28px", width: "100%", maxWidth: "500px", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "40px", height: "4px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "9999px", margin: "0 auto 24px" }} />
            {(() => {
              const person = peoplePatterns.find(p => p.name === selectedPerson);
              if (!person) return null;
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "9999px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "white", fontSize: "24px", fontWeight: 600 }}>{person.name[0]}</span></div>
                    <div><p style={{ color: "white", fontSize: "20px", fontWeight: 600 }}>{person.name}</p><p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>Mentioned {person.count} times</p></div>
                  </div>
                  {person.topDay && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "16px" }}>You talk about {person.name} most on <span style={{ color: "#a855f7" }}>{person.topDay}s</span></p>}
                  {person.recentContext && <div style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "14px", marginBottom: "24px" }}><p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "6px" }}>RECENT MENTION</p><p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: 1.5 }}>"{person.recentContext}..."</p></div>}
                  <button onClick={() => startChatAbout(person.name)} style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #a855f7, #ec4899)", color: "white", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>Talk to MIRA about {person.name}</button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}