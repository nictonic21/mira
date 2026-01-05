"use client";

import { useState } from "react";
import { signUp } from "../../lib/supabase";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white", display: "flex", flexDirection: "column" }}>
      
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        
        {/* Logo */}
        <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(168,85,247,0.3)", marginBottom: "24px" }}>
          <span style={{ color: "white", fontSize: "32px", fontWeight: 700 }}>M</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px" }}>Create account</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", marginBottom: "32px" }}>Your life has a pattern. MIRA remembers.</p>

        {success ? (
          <div style={{ textAlign: "center", maxWidth: "320px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "9999px", backgroundColor: "rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "32px", height: "32px", color: "#22c55e" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 500, marginBottom: "12px" }}>Check your email</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "24px" }}>We've sent a confirmation link to {email}</p>
            <a href="/login" style={{ color: "#a855f7", fontSize: "14px", textDecoration: "none" }}>Go to login →</a>
          </div>
        ) : (
          <form onSubmit={handleSignUp} style={{ width: "100%", maxWidth: "320px" }}>
            
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

            <div style={{ marginBottom: "16px" }}>
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

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "white", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: "100%", padding: "18px", borderRadius: "14px", border: "none", background: isLoading ? "rgba(168,85,247,0.5)" : "linear-gradient(135deg, #a855f7, #ec4899)", color: "white", fontSize: "16px", fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", boxShadow: "0 0 30px rgba(168,85,247,0.3)", marginBottom: "20px" }}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>

            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
              Already have an account? <a href="/login" style={{ color: "#a855f7", textDecoration: "none" }}>Sign in</a>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}