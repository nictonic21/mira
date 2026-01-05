"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white", display: "flex", flexDirection: "column" }}>
      
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        
        {/* Logo */}
        <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(168,85,247,0.3)", marginBottom: "24px" }}>
          <span style={{ color: "white", fontSize: "32px", fontWeight: 700 }}>M</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px" }}>Welcome back</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", marginBottom: "32px" }}>Your patterns are waiting</p>

        <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "320px" }}>
          
          {error && (
            <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px" }}>
              <p style={{ color: "#ef4444", fontSize: "13px" }}>{error}</p>
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "white", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "white", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
              placeholder="••••••••"
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: "24px" }}>
            <a href="/forgot-password" style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textDecoration: "none" }}>Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ width: "100%", padding: "18px", borderRadius: "14px", border: "none", background: isLoading ? "rgba(168,85,247,0.5)" : "linear-gradient(135deg, #a855f7, #ec4899)", color: "white", fontSize: "16px", fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", boxShadow: "0 0 30px rgba(168,85,247,0.3)", marginBottom: "20px" }}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
            Don't have an account? <a href="/signup" style={{ color: "#a855f7", textDecoration: "none" }}>Create one</a>
          </p>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "32px 0", width: "100%", maxWidth: "320px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>or continue as guest</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
        </div>

        <a href="/" style={{ padding: "14px 28px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", fontSize: "14px", textDecoration: "none" }}>
          Continue without account
        </a>

      </main>
    </div>
  );
}