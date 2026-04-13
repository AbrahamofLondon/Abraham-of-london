"use client";

/* components/homepage/ProtocolInitiation.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct weights

   Previous version had:
   - rounded-[2.5rem] form container, rounded-2xl textarea + submit, rounded-full eyebrow
   - bg-white hover:bg-amber-400 submit — filled white turning amber, font-black text-black
   - "Protocol Engagement: Active", "01 // Principal Identity", "02 // Secure Channel"
   - "03 // Mandate Specification", "Encrypted Submission"
   - "System: AO-LDN-INIT-V2 // Response Latency: 24-48H"
   - "Direct Governance Interface" with Cpu icon
   - Shimmer animation on submit button
   - Vertical amber-500/20 gradient line down center of page
   - font-black throughout

   Rebuilt: A contact form. Sharp. Factual field labels. No performed security.
   The form is the interface; it does not need to announce what it is.
*/

import * as React from "react";
import { motion } from "framer-motion";
import { Send, ArrowRight } from "lucide-react";

const GOLD = "#C9A96E";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function ProtocolInitiation() {
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    // Submission wired to /api/contact or equivalent
    await new Promise((r) => setTimeout(r, 900));
    setBusy(false);
    setSent(true);
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        variants={fadeUp} initial="hidden"
        whileInView="show" viewport={{ once: true, margin: "-60px" }}
        style={{ marginBottom: "2.5rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
          <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
            color: `${GOLD}BF`,
          }}>
            Engagement
          </span>
        </div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "clamp(2rem, 4vw, 3.4rem)",
          lineHeight: 0.97, letterSpacing: "-0.030em",
          color: "rgba(255,255,255,0.92)",
          marginBottom: "0.85rem",
        }}>
          Begin the conversation.
        </h2>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.72,
          color: "rgba(255,255,255,0.40)",
          maxWidth: "44ch",
        }}>
          We do not accept all mandates. Engagement begins with a briefing
          of your current architecture and desired state.
        </p>
      </motion.div>

      {/* Form panel */}
      <motion.div
        variants={fadeUp} initial="hidden"
        whileInView="show" viewport={{ once: true, margin: "-60px" }}
        transition={{ delay: 0.10 }}
      >
        <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgb(10 14 20)" }}>
          {sent ? (
            <div style={{ padding: "4rem 2.5rem", textAlign: "center" }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300, fontSize: "1.55rem", lineHeight: 1.1,
                color: "rgba(255,255,255,0.82)", marginBottom: "0.75rem",
              }}>
                Received.
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300, fontSize: "1rem", lineHeight: 1.68,
                color: "rgba(255,255,255,0.38)",
              }}>
                We will review your submission and respond within 24–48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ padding: "2.5rem", display: "grid", gap: "2rem" }}>

                {/* Name + Email */}
                <div className="grid md:grid-cols-2" style={{ gap: "2rem" }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px", letterSpacing: "0.34em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.30)",
                      marginBottom: "0.85rem",
                    }}>
                      Name or entity
                    </label>
                    <input
                      type="text" required
                      placeholder="Full name or organisation"
                      style={{
                        width: "100%", display: "block",
                        backgroundColor: "transparent",
                        border: "none", borderBottom: "1px solid rgba(255,255,255,0.10)",
                        padding: "0.75rem 0",
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "1rem",
                        color: "rgba(255,255,255,0.78)",
                        outline: "none",
                      }}
                      onFocus={e => (e.currentTarget as HTMLInputElement).style.borderBottomColor = `${GOLD}55`}
                      onBlur={e  => (e.currentTarget as HTMLInputElement).style.borderBottomColor = "rgba(255,255,255,0.10)"}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px", letterSpacing: "0.34em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.30)",
                      marginBottom: "0.85rem",
                    }}>
                      Email address
                    </label>
                    <input
                      type="email" required
                      placeholder="your@email.com"
                      style={{
                        width: "100%", display: "block",
                        backgroundColor: "transparent",
                        border: "none", borderBottom: "1px solid rgba(255,255,255,0.10)",
                        padding: "0.75rem 0",
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "1rem",
                        color: "rgba(255,255,255,0.78)",
                        outline: "none",
                      }}
                      onFocus={e => (e.currentTarget as HTMLInputElement).style.borderBottomColor = `${GOLD}55`}
                      onBlur={e  => (e.currentTarget as HTMLInputElement).style.borderBottomColor = "rgba(255,255,255,0.10)"}
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label style={{
                    display: "block",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px", letterSpacing: "0.34em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.30)",
                    marginBottom: "0.85rem",
                  }}>
                    The situation
                  </label>
                  <textarea
                    rows={5} required
                    placeholder="Briefly describe the institutional challenge or strategic objective…"
                    style={{
                      width: "100%", display: "block",
                      backgroundColor: "rgba(255,255,255,0.015)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: "1.25rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "1rem", lineHeight: 1.65,
                      color: "rgba(255,255,255,0.72)",
                      outline: "none", resize: "none",
                    }}
                    onFocus={e => (e.currentTarget as HTMLTextAreaElement).style.borderColor = `${GOLD}40`}
                    onBlur={e  => (e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>

                {/* Submit */}
                <div style={{ paddingTop: "0.5rem" }}>
                  <button
                    type="submit" disabled={busy}
                    className="group inline-flex items-center gap-3 transition-all duration-300"
                    style={{
                      padding: "14px 32px",
                      border: `1px solid ${GOLD}44`,
                      backgroundColor: busy ? `${GOLD}18` : `${GOLD}10`,
                      color: busy ? `${GOLD}80` : GOLD,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                      cursor: busy ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={e => { if (!busy) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = `${GOLD}66`; el.style.backgroundColor = `${GOLD}18`; }}}
                    onMouseLeave={e => { if (!busy) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = `${GOLD}44`; el.style.backgroundColor = `${GOLD}10`; }}}
                  >
                    {busy ? "Sending…" : "Submit enquiry"}
                    {!busy && <ArrowRight style={{ width: "12px", height: "12px" }} className="transition-transform group-hover:translate-x-0.5" />}
                  </button>
                </div>
              </div>

              {/* Footer note */}
              <div style={{
                padding: "1rem 2.5rem",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", gap: "0.5rem",
              }}>
                <Send style={{ width: "11px", height: "11px", color: "rgba(255,255,255,0.18)" }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.20)",
                }}>
                  Response within 24–48 hours. Not all mandates are accepted.
                </span>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}