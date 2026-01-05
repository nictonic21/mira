"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const steps = [
    {
      title: "Welcome to MIRA",
      subtitle: "Your life has a pattern",
      description: "MIRA is your personal reflection companion. Talk freely, log your feelings and dreams, and watch as patterns in your life emerge.",
      icon: "M",
      gradient: "linear-gradient(135deg, #a855f7, #ec4899)",
    },
    {
      title: "Talk freely",
      subtitle: "MIRA remembers everything",
      description: "Share what's on your mind. MIRA listens without judgment and remembers your conversations to help you see the bigger picture.",
      icon: "💬",
      gradient: "linear-gradient(135deg, #6366f1, #a855f7)",
    },
    {
      title: "Log your world",
      subtitle: "Feelings and dreams",
      description: "Quick mood check-ins and dream logging help MIRA understand your inner life. Just a tap to capture how you feel.",
      icon: "✨",
      gradient: "linear-gradient(135deg, #ec4899, #f472b6)",
    },
    {
      title: "Discover patterns",
      subtitle: "Nothing happens just once",
      description: "You talk about him most on Sunday nights. You've had that dream before. MIRA spots patterns you'd miss.",
      icon: "🔮",
      gradient: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    },
    {
      title: "Time reveals truth",
      subtitle: "MIRA predicts",
      description: "Based on your patterns, MIRA can anticipate how you might feel. Like a friend who truly knows you.",
      icon: "🌙",
      gradient: "linear-gradient(135deg, #f472b6, #fb7185)",
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem("mira-onboarded", "true");
      router.push("/signup");
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("mira-onboarded", "true");
    router.push("/signup");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "white", display: "flex", flexDirection: "column" }}>
      
      {/* Skip button */}
      {!isLastStep && (
        <button onClick={handleSkip} style={{ position: "absolute", top: "24px", right: "24px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "14px", cursor: "pointer", padding: "8px" }}>
          Skip
        </button>
      )}

      {/* Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 32px", textAlign: "center" }}>
        
        {/* Icon */}
        <div style={{ width: "120px", height: "120px", borderRadius: "36px", background: currentStep.gradient, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 60px rgba(168,85,247,0.3)", marginBottom: "40px", transition: "all 0.3s ease" }}>
          <span style={{ fontSize: currentStep.icon.length === 1 ? "48px" : "56px", color: "white", fontWeight: 700 }}>{currentStep.icon}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: "32px", fontWeight: 600, marginBottom: "12px", transition: "all 0.3s ease" }}>{currentStep.title}</h1>
        
        {/* Subtitle */}
        <p style={{ color: "#a855f7", fontSize: "16px", fontWeight: 500, marginBottom: "20px", transition: "all 0.3s ease" }}>{currentStep.subtitle}</p>
        
        {/* Description */}
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: 1.7, maxWidth: "320px", transition: "all 0.3s ease" }}>{currentStep.description}</p>

      </main>

      {/* Progress & Button */}
      <div style={{ padding: "32px 24px 48px" }}>
        
        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
          {steps.map((_, i) => (
            <div key={i} style={{ width: i === step ? "24px" : "8px", height: "8px", borderRadius: "9999px", backgroundColor: i === step ? "#a855f7" : "rgba(255,255,255,0.2)", transition: "all 0.3s ease" }} />
          ))}
        </div>

        {/* Button */}
        <button onClick={handleNext} style={{ width: "100%", maxWidth: "320px", margin: "0 auto", display: "block", padding: "18px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg, #a855f7, #ec4899)", color: "white", fontSize: "16px", fontWeight: 600, cursor: "pointer", boxShadow: "0 0 30px rgba(168,85,247,0.3)" }}>
          {isLastStep ? "Get started" : "Continue"}
        </button>

        {/* Sign in link on last step */}
        {isLastStep && (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px", marginTop: "20px" }}>
            Already have an account? <a href="/login" style={{ color: "#a855f7", textDecoration: "none" }}>Sign in</a>
          </p>
        )}
      </div>
    </div>
  );
}