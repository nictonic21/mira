"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setMessage({ type: "error", text: "Please check your email and confirm your account first" });
      } else if (error.message.includes("Invalid login credentials")) {
        setMessage({ type: "error", text: "Invalid email or password" });
      } else {
        setMessage({ type: "error", text: error.message });
      }
    } else if (data.user) {
      localStorage.setItem("mira-onboarded", "true");
      router.push("/");
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: "error", text: "Enter your email first" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://mira-app-one.vercel.app/reset-password",
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password reset email sent! Check your inbox." });
    }
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      
      <div style={{ width: "100%", maxWidth: "360px" }}>
        
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "70px", height: "70px", borderRadius: "22px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 40px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "28px", fontWeight: 700 }}>M</span>
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 600, marginBottom: "8px" }}>Welcome back</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Sign in to continue to MIRA</p>
        </div>

        {/* Message */}
        {message && (
          <div style={{ 
            padding: "14px 18px", 
            borderRadius: "12px", 
            marginBottom: "20px",
            backgroundColor: message.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: message.type === "success" ? "#22c55e" : "#ef4444",
            fontSize: "14px",
            lineHeight: 1.5,
          }}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "8px" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "white",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "8px" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "white",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleForgotPassword}
            style={{
              background: "none",
              border: "none",
              color: "#a855f7",
              fontSize: "13px",
              cursor: "pointer",
              textAlign: "right",
              padding: "0",
            }}
          >
            Forgot password?
          </button>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              border: "none",
              background: isLoading ? "rgba(168,85,247,0.5)" : "linear-gradient(135deg, #a855f7, #ec4899)",
              color: "white",
              fontSize: "16px",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: "8px",
              boxShadow: isLoading ? "none" : "0 0 30px rgba(168,85,247,0.3)",
            }}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Sign up link */}
        <p style={{ textAlign: "center", marginTop: "24px", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
          Don't have an account?{" "}
          <a href="/signup" style={{ color: "#a855f7", textDecoration: "none", fontWeight: 500 }}>Sign up</a>
        </p>
      </div>
    </div>
  );
}