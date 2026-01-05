"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function LookBack() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [wrappedType, setWrappedType] = useState<"monthly" | "yearly">("monthly");
  const [wrappedSlide, setWrappedSlide] = useState(0);
  const [timeFilter, setTimeFilter] = useState<"all" | "year" | "6months" | "3months">("all");
  const [onThisDay, setOnThisDay] = useState<{ content: string; yearsAgo: number; type: string; color?: string }[]>([]);
  const [monthlyMemories, setMonthlyMemories] = useState<{ month: string; year: number; quote: string; topMood: string; moodColor: string; messageCount: number }[]>([]);
  const [moodJourney, setMoodJourney] = useState<{ month: string; moods: { mood: string; color: string; count: number }[] }[]>([]);
  const [dreams, setDreams] = useState<{ text: string; date: string }[]>([]);
  const [miraRemembers, setMiraRemembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMira, setIsLoadingMira] = useState(false);
  
  const [monthlyWrappedData, setMonthlyWrappedData] = useState({
    totalMessages: 0, totalMoods: 0, totalDreams: 0,
    topMood: "", topMoodCount: 0, topMoodColor: "#a855f7",
    topPerson: "", topPersonCount: 0,
    topDay: "", topDayCount: 0,
    topTopics: [] as { name: string; count: number }[],
  });

  const [yearlyWrappedData, setYearlyWrappedData] = useState({
    totalMessages: 0, totalMoods: 0, totalDreams: 0,
    topMood: "", topMoodCount: 0, topMoodColor: "#a855f7",
    topPerson: "", topPersonCount: 0,
    topDay: "", topDayCount: 0,
    topMonth: "", topMonthCount: 0,
    topTopics: [] as { name: string; count: number }[],
    moodBreakdown: [] as { mood: string; count: number; color: string }[],
  });

  const moodColors: Record<string, string> = {
    Loved: "#fb7185", Happy: "#f472b6", Calm: "#c084fc",
    Anxious: "#a855f7", Tired: "#6366f1", Sad: "#8b5cf6"
  };

  useEffect(() => {
    loadEverything();
  }, [timeFilter]);

  const loadEverything = async () => {
    setIsLoading(true);
    await Promise.all([
      loadOnThisDay(),
      loadMonthlyMemories(),
      loadMoodJourney(),
      loadDreams(),
      loadMonthlyWrappedData(),
      loadYearlyWrappedData(),
      loadMiraRemembers(),
    ]);
    setIsLoading(false);
  };

  const loadOnThisDay = async () => {
    const today = new Date();
    const memories: { content: string; yearsAgo: number; type: string; color?: string }[] = [];

    for (let yearsAgo = 1; yearsAgo <= 5; yearsAgo++) {
      const pastDate = new Date(today);
      pastDate.setFullYear(pastDate.getFullYear() - yearsAgo);
      const dateStr = pastDate.toISOString().split("T")[0];

      const { data: msgData } = await supabase.from("messages").select("*").eq("role", "user").gte("created_at", dateStr).lte("created_at", dateStr + "T23:59:59").limit(1);
      if (msgData && msgData.length > 0) {
        memories.push({ content: msgData[0].content, yearsAgo, type: "message" });
      }

      const { data: moodData } = await supabase.from("moods").select("*").gte("created_at", dateStr).lte("created_at", dateStr + "T23:59:59").limit(1);
      if (moodData && moodData.length > 0) {
        memories.push({ content: `You were feeling ${moodData[0].mood.toLowerCase()}`, yearsAgo, type: "mood", color: moodData[0].color });
      }

      const { data: dreamData } = await supabase.from("dreams").select("*").gte("created_at", dateStr).lte("created_at", dateStr + "T23:59:59").limit(1);
      if (dreamData && dreamData.length > 0) {
        memories.push({ content: dreamData[0].dream_text, yearsAgo, type: "dream" });
      }
    }
    setOnThisDay(memories);
  };

  const loadMonthlyMemories = async () => {
    const memories: { month: string; year: number; quote: string; topMood: string; moodColor: string; messageCount: number }[] = [];
    const now = new Date();
    const monthsToLoad = timeFilter === "3months" ? 3 : timeFilter === "6months" ? 6 : timeFilter === "year" ? 12 : 24;

    for (let i = 1; i <= monthsToLoad; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: msgs } = await supabase.from("messages").select("content").eq("role", "user").gte("created_at", startOfMonth).lte("created_at", endOfMonth).limit(1);
      const { data: moods } = await supabase.from("moods").select("mood, color").gte("created_at", startOfMonth).lte("created_at", endOfMonth);
      const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("role", "user").gte("created_at", startOfMonth).lte("created_at", endOfMonth);

      if (count && count > 0) {
        const moodCounts: Record<string, { count: number; color: string }> = {};
        moods?.forEach(m => {
          if (!moodCounts[m.mood]) moodCounts[m.mood] = { count: 0, color: m.color };
          moodCounts[m.mood].count++;
        });
        const topMood = Object.entries(moodCounts).sort((a, b) => b[1].count - a[1].count)[0];

        memories.push({
          month: date.toLocaleDateString("en-GB", { month: "long" }),
          year: date.getFullYear(),
          quote: msgs?.[0]?.content.slice(0, 80) || "",
          topMood: topMood?.[0] || "",
          moodColor: topMood?.[1]?.color || "#a855f7",
          messageCount: count || 0,
        });
      }
    }
    setMonthlyMemories(memories);
  };

  const loadMoodJourney = async () => {
    const journey: { month: string; moods: { mood: string; color: string; count: number }[] }[] = [];
    const now = new Date();
    const monthsToLoad = timeFilter === "3months" ? 3 : timeFilter === "6months" ? 6 : timeFilter === "year" ? 12 : 24;

    for (let i = 0; i < monthsToLoad; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: moods } = await supabase.from("moods").select("mood, color").gte("created_at", startOfMonth).lte("created_at", endOfMonth);

      if (moods && moods.length > 0) {
        const moodCounts: Record<string, { color: string; count: number }> = {};
        moods.forEach(m => {
          if (!moodCounts[m.mood]) moodCounts[m.mood] = { color: m.color, count: 0 };
          moodCounts[m.mood].count++;
        });

        journey.push({
          month: date.toLocaleDateString("en-GB", { month: "short" }),
          moods: Object.entries(moodCounts).map(([mood, data]) => ({ mood, color: data.color, count: data.count })).sort((a, b) => b.count - a.count),
        });
      }
    }
    setMoodJourney(journey.reverse());
  };

  const loadDreams = async () => {
    const now = new Date();
    let startDate = new Date(0).toISOString();
    if (timeFilter === "3months") startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    else if (timeFilter === "6months") startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();
    else if (timeFilter === "year") startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();

    const { data } = await supabase.from("dreams").select("*").gte("created_at", startDate).order("created_at", { ascending: false }).limit(20);
    if (data) {
      setDreams(data.map(d => ({
        text: d.dream_text,
        date: new Date(d.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      })));
    }
  };

  const loadMonthlyWrappedData = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: msgs, count: msgCount } = await supabase.from("messages").select("*", { count: "exact" }).eq("role", "user").gte("created_at", startOfMonth);
    const { data: moods, count: moodCount } = await supabase.from("moods").select("*", { count: "exact" }).gte("created_at", startOfMonth);
    const { count: dreamCount } = await supabase.from("dreams").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth);

    const moodCounts: Record<string, number> = {};
    moods?.forEach(m => moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1);
    const topMoodEntry = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    const dayCounts: Record<string, number> = {};
    msgs?.forEach(m => {
      const day = new Date(m.created_at).toLocaleDateString("en-GB", { weekday: "long" });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const topDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

    const allText = msgs?.map(m => m.content.toLowerCase()).join(" ") || "";
    const names = ["mum", "mom", "dad", "james", "sarah", "emma", "john", "david", "michael", "brother", "sister", "anna", "kate", "tom", "chris"];
    const personCounts: Record<string, number> = {};
    names.forEach(name => {
      const count = (allText.match(new RegExp(`\\b${name}\\b`, "gi")) || []).length;
      if (count > 0) personCounts[name] = count;
    });
    const topPersonEntry = Object.entries(personCounts).sort((a, b) => b[1] - a[1])[0];

    const topicList = [
      { name: "Work", keywords: ["work", "job", "boss", "office", "career"] },
      { name: "Love", keywords: ["love", "relationship", "partner", "dating"] },
      { name: "Family", keywords: ["family", "mum", "dad", "parents", "brother", "sister"] },
      { name: "Health", keywords: ["health", "tired", "sleep", "exercise", "gym"] },
      { name: "Money", keywords: ["money", "pay", "bills", "afford", "salary"] },
      { name: "Future", keywords: ["future", "dream", "goal", "plan", "want"] },
    ];
    const topTopics = topicList.map(t => ({
      name: t.name,
      count: t.keywords.reduce((sum, kw) => sum + (allText.match(new RegExp(`\\b${kw}\\b`, "gi")) || []).length, 0)
    })).filter(t => t.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);

    setMonthlyWrappedData({
      totalMessages: msgCount || 0,
      totalMoods: moodCount || 0,
      totalDreams: dreamCount || 0,
      topMood: topMoodEntry?.[0] || "",
      topMoodCount: topMoodEntry?.[1] || 0,
      topMoodColor: moodColors[topMoodEntry?.[0]] || "#a855f7",
      topPerson: topPersonEntry?.[0] ? topPersonEntry[0].charAt(0).toUpperCase() + topPersonEntry[0].slice(1) : "",
      topPersonCount: topPersonEntry?.[1] || 0,
      topDay: topDayEntry?.[0] || "",
      topDayCount: topDayEntry?.[1] || 0,
      topTopics,
    });
  };

  const loadYearlyWrappedData = async () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    const { data: msgs, count: msgCount } = await supabase.from("messages").select("*", { count: "exact" }).eq("role", "user").gte("created_at", startOfYear);
    const { data: moods, count: moodCount } = await supabase.from("moods").select("*", { count: "exact" }).gte("created_at", startOfYear);
    const { count: dreamCount } = await supabase.from("dreams").select("*", { count: "exact", head: true }).gte("created_at", startOfYear);

    const moodCounts: Record<string, number> = {};
    moods?.forEach(m => moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1);
    const topMoodEntry = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    const moodBreakdown = Object.entries(moodCounts).map(([mood, count]) => ({ mood, count, color: moodColors[mood] || "#a855f7" })).sort((a, b) => b.count - a.count);

    const dayCounts: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};
    msgs?.forEach(m => {
      const day = new Date(m.created_at).toLocaleDateString("en-GB", { weekday: "long" });
      const month = new Date(m.created_at).toLocaleDateString("en-GB", { month: "long" });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    const topDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    const topMonthEntry = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];

    const allText = msgs?.map(m => m.content.toLowerCase()).join(" ") || "";
    const names = ["mum", "mom", "dad", "james", "sarah", "emma", "john", "david", "michael", "brother", "sister", "anna", "kate", "tom", "chris"];
    const personCounts: Record<string, number> = {};
    names.forEach(name => {
      const count = (allText.match(new RegExp(`\\b${name}\\b`, "gi")) || []).length;
      if (count > 0) personCounts[name] = count;
    });
    const topPersonEntry = Object.entries(personCounts).sort((a, b) => b[1] - a[1])[0];

    const topicList = [
      { name: "Work", keywords: ["work", "job", "boss", "office", "career"] },
      { name: "Love", keywords: ["love", "relationship", "partner", "dating"] },
      { name: "Family", keywords: ["family", "mum", "dad", "parents", "brother", "sister"] },
      { name: "Health", keywords: ["health", "tired", "sleep", "exercise", "gym"] },
      { name: "Money", keywords: ["money", "pay", "bills", "afford", "salary"] },
      { name: "Future", keywords: ["future", "dream", "goal", "plan", "want"] },
    ];
    const topTopics = topicList.map(t => ({
      name: t.name,
      count: t.keywords.reduce((sum, kw) => sum + (allText.match(new RegExp(`\\b${kw}\\b`, "gi")) || []).length, 0)
    })).filter(t => t.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);

    setYearlyWrappedData({
      totalMessages: msgCount || 0,
      totalMoods: moodCount || 0,
      totalDreams: dreamCount || 0,
      topMood: topMoodEntry?.[0] || "",
      topMoodCount: topMoodEntry?.[1] || 0,
      topMoodColor: moodColors[topMoodEntry?.[0]] || "#a855f7",
      topPerson: topPersonEntry?.[0] ? topPersonEntry[0].charAt(0).toUpperCase() + topPersonEntry[0].slice(1) : "",
      topPersonCount: topPersonEntry?.[1] || 0,
      topDay: topDayEntry?.[0] || "",
      topDayCount: topDayEntry?.[1] || 0,
      topMonth: topMonthEntry?.[0] || "",
      topMonthCount: topMonthEntry?.[1] || 0,
      topTopics,
      moodBreakdown,
    });
  };

  const loadMiraRemembers = async () => {
    const { data: msgs } = await supabase.from("messages").select("content, created_at").eq("role", "user").order("created_at", { ascending: false }).limit(50);
    
    if (msgs && msgs.length > 5) {
      setIsLoadingMira(true);
      try {
        const highlights = msgs.filter(m => m.content.length > 50).slice(0, 10);
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: `You are MIRA, looking back at meaningful moments from someone's conversations. Pick 3 touching or significant moments and write them as memories.

Their messages: ${highlights.map(m => `"${m.content.slice(0, 150)}"`).join(", ")}

Write exactly 3 memories, each starting with "I remember when you..." 
Keep each one short (1-2 sentences max).
Be warm and personal.
Format: Just the 3 memories, one per line, nothing else.`
            }]
          }),
        });
        const data = await response.json();
        if (data.message) {
          const memories = data.message.split("\n").filter((line: string) => line.trim().length > 0).slice(0, 3);
          setMiraRemembers(memories);
        }
      } catch (error) {
        console.error("Error loading MIRA remembers:", error);
      }
      setIsLoadingMira(false);
    }
  };

  const currentMonth = new Date().toLocaleDateString("en-GB", { month: "long" });
  const currentYear = new Date().getFullYear();
  const wrappedData = wrappedType === "monthly" ? monthlyWrappedData : yearlyWrappedData;

  const monthlySlides = [
    <div key="m0" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <div style={{ width: "100px", height: "100px", borderRadius: "30px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px", boxShadow: "0 0 60px rgba(168,85,247,0.4)" }}>
        <span style={{ color: "white", fontSize: "40px", fontWeight: 700 }}>M</span>
      </div>
      <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "12px" }}>Your {currentMonth}</h1>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>Wrapped</p>
    </div>,
    <div key="m1" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "16px" }}>This month you sent</p>
      <p style={{ fontSize: "80px", fontWeight: 700, background: "linear-gradient(135deg, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{monthlyWrappedData.totalMessages}</p>
      <p style={{ fontSize: "24px", fontWeight: 500, marginTop: "8px" }}>messages to MIRA</p>
    </div>,
    <div key="m2" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "24px" }}>Your top mood was</p>
      <div style={{ position: "relative", width: "120px", height: "120px", marginBottom: "24px" }}>
        <div style={{ position: "absolute", inset: "-20px", borderRadius: "9999px", backgroundColor: monthlyWrappedData.topMoodColor, filter: "blur(40px)", opacity: 0.5 }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "9999px", background: `linear-gradient(135deg, ${monthlyWrappedData.topMoodColor}, ${monthlyWrappedData.topMoodColor}bb)` }} />
      </div>
      <p style={{ fontSize: "32px", fontWeight: 600, color: monthlyWrappedData.topMoodColor }}>{monthlyWrappedData.topMood || "No moods yet"}</p>
      {monthlyWrappedData.topMoodCount > 0 && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", marginTop: "8px" }}>{monthlyWrappedData.topMoodCount} times</p>}
    </div>,
    <div key="m3" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "24px" }}>You talked most about</p>
      {monthlyWrappedData.topPerson ? (
        <>
          <div style={{ width: "100px", height: "100px", borderRadius: "9999px", background: "linear-gradient(135deg, #ec4899, #f472b6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
            <span style={{ color: "white", fontSize: "40px", fontWeight: 600 }}>{monthlyWrappedData.topPerson[0]}</span>
          </div>
          <p style={{ fontSize: "32px", fontWeight: 600 }}>{monthlyWrappedData.topPerson}</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", marginTop: "8px" }}>{monthlyWrappedData.topPersonCount} mentions</p>
        </>
      ) : <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.5)" }}>Keep chatting!</p>}
    </div>,
    <div key="m4" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "24px" }}>You chat most on</p>
      <p style={{ fontSize: "48px", fontWeight: 700, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{monthlyWrappedData.topDay || "—"}s</p>
    </div>,
    <div key="m5" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
        <span style={{ color: "white", fontSize: "32px", fontWeight: 700 }}>M</span>
      </div>
      <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Your {currentMonth}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "32px" }}>
        <div><p style={{ fontSize: "32px", fontWeight: 700, color: "#a855f7" }}>{monthlyWrappedData.totalMessages}</p><p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>messages</p></div>
        <div><p style={{ fontSize: "32px", fontWeight: 700, color: "#ec4899" }}>{monthlyWrappedData.totalMoods}</p><p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>moods</p></div>
        <div><p style={{ fontSize: "32px", fontWeight: 700, color: "#8b5cf6" }}>{monthlyWrappedData.totalDreams}</p><p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>dreams</p></div>
      </div>
      <button onClick={() => { setShowWrapped(false); setWrappedSlide(0); }} style={{ padding: "16px 32px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #a855f7, #ec4899)", color: "white", fontSize: "16px", fontWeight: 600, cursor: "pointer" }}>Done</button>
    </div>,
  ];

  const yearlySlides = [
    <div key="y0" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <div style={{ width: "100px", height: "100px", borderRadius: "30px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px", boxShadow: "0 0 60px rgba(168,85,247,0.4)" }}>
        <span style={{ color: "white", fontSize: "40px", fontWeight: 700 }}>M</span>
      </div>
      <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "12px" }}>{currentYear}</h1>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "18px" }}>Your Year with MIRA</p>
    </div>,
    <div key="y1" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "16px" }}>This year you sent</p>
      <p style={{ fontSize: "80px", fontWeight: 700, background: "linear-gradient(135deg, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{yearlyWrappedData.totalMessages}</p>
      <p style={{ fontSize: "24px", fontWeight: 500, marginTop: "8px" }}>messages to MIRA</p>
    </div>,
    <div key="y2" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "24px" }}>Your year in moods</p>
      {yearlyWrappedData.moodBreakdown.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "280px" }}>
          {yearlyWrappedData.moodBreakdown.slice(0, 4).map((mood, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "9999px", backgroundColor: mood.color, flexShrink: 0 }} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <p style={{ color: "white", fontSize: "16px", fontWeight: 500 }}>{mood.mood}</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{mood.count} times</p>
              </div>
            </div>
          ))}
        </div>
      ) : <p style={{ color: "rgba(255,255,255,0.5)" }}>No moods logged yet</p>}
    </div>,
    <div key="y3" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "24px" }}>Your busiest month was</p>
      <p style={{ fontSize: "48px", fontWeight: 700, background: "linear-gradient(135deg, #22c55e, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{yearlyWrappedData.topMonth || "—"}</p>
      {yearlyWrappedData.topMonthCount > 0 && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", marginTop: "12px" }}>{yearlyWrappedData.topMonthCount} messages</p>}
    </div>,
    <div key="y4" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "24px" }}>You talked most about</p>
      {yearlyWrappedData.topPerson ? (
        <>
          <div style={{ width: "100px", height: "100px", borderRadius: "9999px", background: "linear-gradient(135deg, #ec4899, #f472b6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
            <span style={{ color: "white", fontSize: "40px", fontWeight: 600 }}>{yearlyWrappedData.topPerson[0]}</span>
          </div>
          <p style={{ fontSize: "32px", fontWeight: 600 }}>{yearlyWrappedData.topPerson}</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", marginTop: "8px" }}>{yearlyWrappedData.topPersonCount} mentions this year</p>
        </>
      ) : <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.5)" }}>Keep chatting!</p>}
    </div>,
    <div key="y5" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "32px" }}>What was on your mind</p>
      {yearlyWrappedData.topTopics.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {yearlyWrappedData.topTopics.map((topic, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "32px", fontWeight: 700, color: ["#a855f7", "#ec4899", "#6366f1"][i] }}>{i + 1}</span>
              <span style={{ fontSize: "24px", fontWeight: 500 }}>{topic.name}</span>
            </div>
          ))}
        </div>
      ) : <p style={{ color: "rgba(255,255,255,0.5)" }}>Keep chatting to see topics</p>}
    </div>,
    <div key="y6" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
        <span style={{ color: "white", fontSize: "32px", fontWeight: 700 }}>M</span>
      </div>
      <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Your {currentYear}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "32px" }}>
        <div><p style={{ fontSize: "32px", fontWeight: 700, color: "#a855f7" }}>{yearlyWrappedData.totalMessages}</p><p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>messages</p></div>
        <div><p style={{ fontSize: "32px", fontWeight: 700, color: "#ec4899" }}>{yearlyWrappedData.totalMoods}</p><p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>moods</p></div>
        <div><p style={{ fontSize: "32px", fontWeight: 700, color: "#8b5cf6" }}>{yearlyWrappedData.totalDreams}</p><p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>dreams</p></div>
      </div>
      <button onClick={() => { setShowWrapped(false); setWrappedSlide(0); }} style={{ padding: "16px 32px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #a855f7, #ec4899)", color: "white", fontSize: "16px", fontWeight: 600, cursor: "pointer" }}>Done</button>
    </div>,
  ];

  const wrappedSlides = wrappedType === "monthly" ? monthlySlides : yearlySlides;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white" }}>
      
      {/* Wrapped Modal */}
      {showWrapped && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "#020617", zIndex: 200, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "6px", padding: "20px", justifyContent: "center" }}>
            {wrappedSlides.map((_, i) => (
              <div key={i} style={{ width: i === wrappedSlide ? "24px" : "8px", height: "8px", borderRadius: "4px", backgroundColor: i === wrappedSlide ? "#a855f7" : "rgba(255,255,255,0.2)", transition: "all 0.3s" }} />
            ))}
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{wrappedSlides[wrappedSlide]}</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 40px 40px" }}>
            <button onClick={() => setWrappedSlide(Math.max(0, wrappedSlide - 1))} disabled={wrappedSlide === 0} style={{ padding: "14px 28px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "transparent", color: wrappedSlide === 0 ? "rgba(255,255,255,0.2)" : "white", fontSize: "15px", cursor: wrappedSlide === 0 ? "not-allowed" : "pointer" }}>Back</button>
            {wrappedSlide < wrappedSlides.length - 1 && (
              <button onClick={() => setWrappedSlide(wrappedSlide + 1)} style={{ padding: "14px 28px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #a855f7, #ec4899)", color: "white", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>Next</button>
            )}
          </div>
          <button onClick={() => { setShowWrapped(false); setWrappedSlide(0); }} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "28px", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Header */}
      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>M</span>
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 500 }}>Look Back</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Your memories</p>
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
              <a href="/look-back" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#a855f7", textDecoration: "none", borderRadius: "10px", backgroundColor: "rgba(168,85,247,0.1)" }}>Look Back</a>
              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
              <a href="/history" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>History</a>
              <a href="/settings" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "rgba(255,255,255,0.7)", textDecoration: "none", borderRadius: "10px" }}>Settings</a>
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
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading your memories...</p>
          </div>
        ) : (
          <>
            {/* Wrapped Buttons */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              <button onClick={() => { setWrappedType("monthly"); setShowWrapped(true); }} style={{ flex: 1, padding: "16px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg, #a855f7, #ec4899)", cursor: "pointer", textAlign: "left", boxShadow: "0 0 30px rgba(168,85,247,0.2)" }}>
                <p style={{ color: "white", fontSize: "15px", fontWeight: 600 }}>{currentMonth}</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>Wrapped ✨</p>
              </button>
              <button onClick={() => { setWrappedType("yearly"); setShowWrapped(true); }} style={{ flex: 1, padding: "16px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", cursor: "pointer", textAlign: "left", boxShadow: "0 0 30px rgba(99,102,241,0.2)" }}>
                <p style={{ color: "white", fontSize: "15px", fontWeight: 600 }}>{currentYear}</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>Year in Review ✨</p>
              </button>
            </div>

            {/* Time Filter */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
              {[{ value: "all", label: "All Time" }, { value: "year", label: "Past Year" }, { value: "6months", label: "6 Months" }, { value: "3months", label: "3 Months" }].map((filter) => (
                <button key={filter.value} onClick={() => setTimeFilter(filter.value as any)} style={{ padding: "10px 16px", borderRadius: "20px", border: timeFilter === filter.value ? "1px solid rgba(168,85,247,0.5)" : "1px solid rgba(255,255,255,0.1)", backgroundColor: timeFilter === filter.value ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.03)", color: timeFilter === filter.value ? "#a855f7" : "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>{filter.label}</button>
              ))}
            </div>

            {/* MIRA Remembers */}
            {(miraRemembers.length > 0 || isLoadingMira) && (
              <section style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(168,85,247,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>M</span>
                  </div>
                  <p style={{ color: "#a855f7", fontSize: "12px", fontWeight: 600 }}>MIRA REMEMBERS</p>
                </div>
                {isLoadingMira ? (
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", fontStyle: "italic" }}>Thinking back...</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {miraRemembers.map((memory, i) => (
                      <p key={i} style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", lineHeight: 1.6, paddingLeft: "12px", borderLeft: "2px solid rgba(168,85,247,0.3)" }}>{memory}</p>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Monthly Memories */}
            <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>MONTHLY MEMORIES</p>
              {monthlyMemories.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {monthlyMemories.map((memory, i) => (
                    <div key={i} style={{ padding: "16px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "14px", borderLeft: `3px solid ${memory.moodColor}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <p style={{ color: "white", fontSize: "15px", fontWeight: 500 }}>{memory.month} {memory.year}</p>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>{memory.messageCount} msgs</span>
                      </div>
                      {memory.quote && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", fontStyle: "italic", marginBottom: "8px" }}>"{memory.quote}..."</p>}
                      {memory.topMood && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "9999px", backgroundColor: memory.moodColor }} />
                          <span style={{ color: memory.moodColor, fontSize: "12px" }}>Mostly {memory.topMood.toLowerCase()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", fontStyle: "italic", textAlign: "center", padding: "20px" }}>Keep using MIRA to build memories</p>
              )}
            </section>

            {/* On This Day */}
            <section style={{ backgroundColor: "rgba(139,92,246,0.1)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(139,92,246,0.2)" }}>
              <p style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>ON THIS DAY</p>
              {onThisDay.length > 0 ? (
                onThisDay.map((memory, i) => (
                  <div key={i} style={{ marginBottom: i < onThisDay.length - 1 ? "16px" : 0, paddingBottom: i < onThisDay.length - 1 ? "16px" : 0, borderBottom: i < onThisDay.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "6px" }}>{memory.yearsAgo} year{memory.yearsAgo > 1 ? "s" : ""} ago • {memory.type === "message" ? "💬" : memory.type === "mood" ? "🎭" : "🌙"}</p>
                    <p style={{ color: memory.color || "rgba(255,255,255,0.85)", fontSize: "14px", lineHeight: 1.5 }}>
                      {memory.type === "message" ? `"${memory.content.slice(0, 120)}${memory.content.length > 120 ? "..." : ""}"` : memory.content}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", fontStyle: "italic", textAlign: "center", padding: "20px" }}>In a year, you'll see what you were thinking today</p>
              )}
            </section>

            {/* Mood Journey */}
            <section style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>MOOD JOURNEY</p>
              {moodJourney.length > 0 ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {moodJourney.map((month, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", width: "32px" }}>{month.month}</p>
                        <div style={{ flex: 1, display: "flex", height: "20px", borderRadius: "10px", overflow: "hidden" }}>
                          {month.moods.map((mood, j) => {
                            const total = month.moods.reduce((sum, m) => sum + m.count, 0);
                            return <div key={j} style={{ width: `${(mood.count / total) * 100}%`, backgroundColor: mood.color, minWidth: "4px" }} title={`${mood.mood}: ${mood.count}`} />;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px", justifyContent: "center" }}>
                    {Object.entries(moodColors).map(([mood, color]) => (
                      <div key={mood} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "9999px", backgroundColor: color }} />
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>{mood}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", fontStyle: "italic", textAlign: "center", padding: "20px" }}>Log moods to see your journey</p>
              )}
            </section>

            {/* Dream Journal */}
            <section style={{ backgroundColor: "rgba(236,72,153,0.1)", borderRadius: "20px", padding: "20px", border: "1px solid rgba(236,72,153,0.2)" }}>
              <p style={{ color: "#ec4899", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>DREAM JOURNAL</p>
              {dreams.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {dreams.slice(0, 5).map((dream, i) => (
                    <div key={i} style={{ paddingBottom: i < Math.min(dreams.length, 5) - 1 ? "16px" : 0, borderBottom: i < Math.min(dreams.length, 5) - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "6px" }}>{dream.date}</p>
                      <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", lineHeight: 1.6 }}>{dream.text}</p>
                    </div>
                  ))}
                  {dreams.length > 5 && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center" }}>+ {dreams.length - 5} more dreams</p>}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", fontStyle: "italic", marginBottom: "12px" }}>Your dreams will appear here</p>
                  <a href="/reflect" style={{ display: "inline-block", padding: "10px 20px", backgroundColor: "rgba(236,72,153,0.2)", borderRadius: "10px", color: "#ec4899", textDecoration: "none", fontSize: "13px" }}>Log a dream</a>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}