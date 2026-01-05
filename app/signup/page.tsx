"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match" });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://mira-app-one.vercel.app/auth/callback",
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else if (data.user) {
      setEmailSent(true);
      setMessage({ type: "success", text: "Check your email to confirm your account!" });
    }

    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: "360px", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, #22c55e, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 0 40px rgba(34,197,94,0.3)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "40px", height: "40px", color: "white" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "12px" }}>Check your email</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: 1.6, marginBottom: "24px" }}>
            We've sent a confirmation link to<br />
            <span style={{ color: "#a855f7", fontWeight: 500 }}>{email}</span>
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginBottom: "24px" }}>
            Click the link in your email to activate your account, then come back here to sign in.
          </p>
          <a href="/login" style={{ display: "inline-block", padding: "14px 28px", borderRadius: "12px", border: "1px solid rgba(168,85,247,0.3)", backgroundColor: "rgba(168,85,247,0.1)", color: "#a855f7", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
            Go to Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      
      <div style={{ width: "100%", maxWidth: "360px" }}>
        
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "70px", height: "70px", borderRadius: "22px", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 40px rgba(168,85,247,0.3)" }}>
            <span style={{ color: "white", fontSize: "28px", fontWeight: 700 }}>M</span>
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 600, marginBottom: "8px" }}>Create account</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Start your journey with MIRA</p>
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
        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
              placeholder="At least 6 characters"
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
            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "8px" }}>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Terms */}
        <p style={{ textAlign: "center", marginTop: "20px", color: "rgba(255,255,255,0.4)", fontSize: "12px", lineHeight: 1.5 }}>
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>

        {/* Login link */}
        <p style={{ textAlign: "center", marginTop: "20px", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#a855f7", textDecoration: "none", fontWeight: 500 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}