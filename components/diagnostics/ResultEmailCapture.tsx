"use client";

/**
 * Result Email Capture — high-trust, post-result email collection.
 *
 * Principles:
 * - Placed AFTER result impact, never before
 * - "Save this reading" not "Sign up"
 * - Trust disclosure always visible
 * - "Continue without saving" always available
 * - No popups, no gates, no urgency
 *
 * The user must feel: "I am choosing to continue this conversation"
 */

import * as React from "react";

type Props = {
  source: string;
  resultRef?: string | null;
};

export default function ResultEmailCapture({ source, resultRef }: Props) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error" | "skipped">("idle");
  const [focused, setFocused] = React.useState(false);

  // Check if already captured
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem("aol_captured_email");
      if (stored) setStatus("saved");
    } catch { /* ignore */ }
  }, []);

  async function handleSave() {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    setStatus("saving");
    try {
      const sessionId = resultRef ?? `${source}_${Date.now().toString(36)}`;
      await fetch("/api/diagnostics/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source, resultRef: sessionId }),
      });
      setStatus("saved");
      try { sessionStorage.setItem("aol_captured_email", trimmed); } catch { /* ignore */ }
    } catch {
      setStatus("error");
    }
  }

  if (status === "saved") {
    return (
      <div style={{ padding: "16px 20px", borderLeft: "2px solid rgba(110,231,183,0.25)", backgroundColor: "rgba(110,231,183,0.02)" }}>
        <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(110,231,183,0.50)" }}>
          Saved. You will be able to track this pattern over time.
        </p>
      </div>
    );
  }

  if (status === "skipped") return null;

  return (
    <div style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)" }}>

      {/* Title */}
      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 400, fontSize: "16px", color: "rgba(255,255,255,0.75)" }}>
        Save this reading
      </p>

      {/* Value proposition */}
      <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.40)", marginTop: "6px" }}>
        This is not a one-time insight. It becomes more accurate as your decisions evolve.
      </p>

      {/* Input row */}
      <div style={{ display: "flex", gap: "8px", marginTop: "14px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "rgba(255,255,255,0.20)", pointerEvents: "none" }}>
            &#128274;
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Enter your email"
            autoComplete="email"
            style={{
              width: "100%",
              padding: "11px 12px 11px 32px",
              border: `1px solid ${focused ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.08)"}`,
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.80)",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 200ms",
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving" || !email.trim()}
          style={{
            padding: "11px 20px",
            border: "1px solid rgba(255,255,255,0.15)",
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.65)",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "9px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: status === "saving" ? "not-allowed" : "pointer",
            flexShrink: 0,
            minHeight: "44px",
          }}
        >
          {status === "saving" ? "Saving..." : "Save and continue"}
        </button>
      </div>

      {/* Focus helper */}
      {focused && (
        <p style={{ marginTop: "6px", fontSize: "12px", color: "rgba(255,255,255,0.25)", transition: "opacity 200ms" }}>
          This allows you to track whether this improves — or repeats.
        </p>
      )}

      {/* Trust disclosure */}
      <p style={{ marginTop: "10px", fontSize: "11px", lineHeight: 1.6, color: "rgba(255,255,255,0.22)" }}>
        We store your responses to track your decision pattern over time.
        We do not sell or share your data. You can remove your data at any time.
      </p>

      {/* Error */}
      {status === "error" && (
        <p style={{ marginTop: "6px", fontSize: "12px", color: "rgba(252,165,165,0.55)" }}>Unable to save. Try again.</p>
      )}

      {/* Skip option */}
      <button
        type="button"
        onClick={() => setStatus("skipped")}
        style={{
          marginTop: "12px",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: "12px",
          color: "rgba(255,255,255,0.20)",
        }}
      >
        Continue without saving
      </button>
    </div>
  );
}
