"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, getUser } from "../lib/supabase";

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const prompts = [
    "What's been on your mind lately?",
    "Tell me about your day",
    "What's your biggest dream?",
    "Who matters most to you?",
  ];

  useEffect(() => {
    checkOnboarding();
    loadUser();
    const savedVoice = localStorage.getItem("mira-voice");
    if (savedVoice !== null) setVoiceEnabled(savedVoice === "true");

    // Check for prompt in URL (from other pages like Reveal)
    const promptParam = searchParams.get("prompt");
    if (promptParam) {
      // Clear the URL parameter
      router.replace("/", { scroll: false });
      // Send the prompt as a message
      setTimeout(() => sendMessage(promptParam), 100);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkOnboarding = () => {
    const onboarded = localStorage.getItem("mira-onboarded");
    if (!onboarded) {
      router.push("/onboarding");
    }
  };

  const loadUser = async () => {
    const u = await getUser();
    setUser(u);
  };

  const saveMessage = async (role: string, content: string) => {
    await supabase.from("messages").insert({ role, content });
  };

  const speak = async (text: string) => {
    if (!voiceEnabled) return;
    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error("Speech error:", error);
    }
  };

  const sendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || isLoading) return;
    
    const userMessage = { role: "user", content: messageToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    await saveMessage("user", messageToSend);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      if (data.message) {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
        await saveMessage("assistant", data.message);
        speak(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input not supported in this browser. Try Chrome!");
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const toggleVoice = () => {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    localStorage.setItem("mira-voice", String(newValue));
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white", display: "flex", flexDirection: "column" }}>
      
      {/* Header */}
      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>M</span>
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 500 }}>MIRA</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Your reflection companion</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* New Chat Button - only show if there are messages */}
          {messages.length > 0 && (
            <button onClick={startNewChat} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "transparent", color: "rgba(255,255,255,0.6)", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              New
            </button>
          )}
          
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "24px", height: "24px", color: "rgba(255,255,255,0.6)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99 }} />
            <div style={{ position: "absolute", top: "70px", right: "20px", backgroundColor: "#0f172a", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", padding: "8px", minWidth: "200px", zIndex: 100, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
              <a href="/" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#a855f7", textDecoration: "none", borderRadius: "10px", backgroundColor: "rgba(168,85,247,0.1)" }}>
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
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
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
              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
              <button onClick={toggleVoice} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: voiceEnabled ? "#22c55e" : "rgba(255,255,255,0.5)", background: "none", border: "none", borderRadius: "10px", width: "100%", cursor: "pointer", fontSize: "14px", textAlign: "left" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                Voice {voiceEnabled ? "on" : "off"}
              </button>
              {!user && (
                <>
                  <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
                  <a href="/login" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: "#a855f7", textDecoration: "none", borderRadius: "10px" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                    Sign in
                  </a>
                </>
              )}
            </div>
          </>
        )}
      </header>

      {/* Messages */}
      <main style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Empty State with Prompts */}
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "20px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(168,85,247,0.3)", marginBottom: "24px" }}>
              <span style={{ color: "white", fontSize: "32px", fontWeight: 700 }}>M</span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 500, marginBottom: "8px" }}>Talk to MIRA</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", maxWidth: "280px", marginBottom: "32px" }}>I'm here to listen. The more you share, the better I understand you.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "320px" }}>
              {prompts.map((prompt, i) => (
                <button key={i} onClick={() => sendMessage(prompt)} style={{ padding: "14px 18px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.8)", fontSize: "14px", textAlign: "left", cursor: "pointer", transition: "all 0.2s" }}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: "28px", height: "28px", borderRadius: "10px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "10px", flexShrink: 0, marginTop: "2px" }}>
                <span style={{ color: "white", fontSize: "11px", fontWeight: 700 }}>M</span>
              </div>
            )}
            <div style={{ maxWidth: "75%", padding: "14px 18px", borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px", backgroundColor: msg.role === "user" ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)", border: msg.role === "user" ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: "15px", lineHeight: 1.6, color: "rgba(255,255,255,0.9)" }}>{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "10px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "10px", flexShrink: 0 }}>
              <span style={{ color: "white", fontSize: "11px", fontWeight: 700 }}>M</span>
            </div>
            <div style={{ padding: "14px 18px", borderRadius: "20px 20px 20px 4px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "rgba(168,85,247,0.6)", animation: "pulse 1.5s infinite" }} />
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "rgba(168,85,247,0.6)", animation: "pulse 1.5s infinite 0.2s" }} />
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "rgba(168,85,247,0.6)", animation: "pulse 1.5s infinite 0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <div style={{ padding: "16px 20px 32px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button onClick={startListening} style={{ width: "52px", height: "52px", borderRadius: "16px", border: "none", backgroundColor: isListening ? "rgba(236,72,153,0.3)" : "rgba(255,255,255,0.05)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "22px", height: "22px", color: isListening ? "#ec4899" : "rgba(255,255,255,0.5)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
          </button>
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && sendMessage()} 
            placeholder={isListening ? "Listening..." : "Talk to MIRA..."} 
            style={{ flex: 1, padding: "16px 20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "white", fontSize: "15px", outline: "none" }} 
          />
          <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} style={{ width: "52px", height: "52px", borderRadius: "16px", border: "none", background: isLoading || !input.trim() ? "rgba(168,85,247,0.3)" : "linear-gradient(135deg, #a855f7, #ec4899)", cursor: isLoading || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isLoading || !input.trim() ? "none" : "0 0 20px rgba(168,85,247,0.3)", flexShrink: 0, transition: "all 0.2s" }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px", color: "white" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}