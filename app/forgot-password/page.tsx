"use client";

import { useState } from "react";
import { resetPassword } from "../../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await resetPassword(email);
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
        
        {/* Back button */}
        <a href="/login" style={{ position: "absolute", top: "24px", left: "24px", color: "rgba(255,255,255,0.5)", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back
        </a>

        {/* Logo */}
        <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(168,85,247,0.3)", marginBottom: "24px" }}>
          <span style={{ color: "white", fontSize: "32px", fontWeight: 700 }}>M</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px" }}>Reset password</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", marginBottom: "32px", textAlign: "center", maxWidth: "280px" }}>Enter your email and we'll send you a link to reset your password</p>

        {success ? (
          <div style={{ textAlign: "center", maxWidth: "320px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "9999px", backgroundColor: "rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "32px", height: "32px", color: "#22c55e" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 500, marginBottom: "12px" }}>Check your email</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "24px" }}>We've sent a password reset link to {email}</p>
            <a href="/login" style={{ color: "#a855f7", fontSize: "14px", textDecoration: "none" }}>Back to login →</a>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ width: "100%", maxWidth: "320px" }}>
            
            {error && (
              <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px" }}>
                <p style={{ color: "#ef4444", fontSize: "13px" }}>{error}</p>
              </div>
            )}

            <div style={{ marginBottom: "24px" }}>
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

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: "100%", padding: "18px", borderRadius: "14px", border: "none", background: isLoading ? "rgba(168,85,247,0.5)" : "linear-gradient(135deg, #a855f7, #ec4899)", color: "white", fontSize: "16px", fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", boxShadow: "0 0 30px rgba(168,85,247,0.3)" }}
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}