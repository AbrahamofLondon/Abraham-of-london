/* components/WhoIWorkWith.tsx
   Design: Institutional Monumentalism — the refusal surface
   
   This is the platform's boundary marker. It tells a serious visitor who
   the advisory is for and — more critically — who it is not for.
   
   The commercial mechanism: a serious operator who reads the "not with" list
   and sees their own worst habits named precisely will feel the weight of the
   platform's standards and want to qualify. The copy does this work well.
   The container must not undermine it with performed drama.
   
   Previous version had:
   - italic h2 + text-amber-500 accent — performing drama the copy doesn't need
   - font-bold throughout — platform uses weight 300
   - h-[2px] amber-500 section line — wrong eyebrow signal
   - bg-black instead of canonical tokens
   - text-zinc-300/200/400 — wrong token system
   - border-zinc-800 — wrong token
   - AlertTriangle + "Notice:" prefix — bureaucratic, not authoritative
   - group-hover icon colour on "with" items — decorative restlessness
   
   Rebuilt: The content does the work. The container is still and certain.
   The refusal is more powerful when it is stated quietly.
*/

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle,
  Users, Shield, Target, Compass,
} from "lucide-react";

const GOLD = "#C9A96E";

export interface WhoIWorkWithProps {
  className?: string;
}

const ALLIANCE = [
  {
    accent: "The Protectors",
    text: "Principals carrying real duty — families, teams, institutions.",
    Icon: Shield,
  },
  {
    accent: "The Integrators",
    text: "Leaders who hold doctrine and data without collapsing either into slogans.",
    Icon: Compass,
  },
  {
    accent: "The Truth-Seekers",
    text: "Operators who prefer hard diagnosis over soft affirmation.",
    Icon: Target,
  },
  {
    accent: "The Architects",
    text: "Builders focused on governance and legacy that outlives the moment.",
    Icon: Users,
  },
];

const DIVERGENCE = [
  "Performative strategy — hype decks and momentum theatre.",
  "Validation-seeking leadership — comfort prioritised over accountability.",
  "Cultures allergic to reality — no appetite for constraints.",
  "Integrity as a tool — when principle is treated as optional.",
];

const MANDATE =
  "Advisory is finite. Reserved for missions requiring precision and integrity.";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function WhoIWorkWith({ className = "" }: WhoIWorkWithProps): React.ReactElement {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {/* Section header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
            color: `${GOLD}BF`,
          }}>
            Operational fit
          </span>
        </div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "clamp(2rem, 3.5vw, 3rem)",
          lineHeight: 1.0, letterSpacing: "-0.028em",
          color: "rgba(255,255,255,0.92)",
          marginBottom: "0.85rem",
        }}>
          Selective alignment.
        </h2>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.72,
          color: "rgba(255,255,255,0.42)",
          maxWidth: "48ch",
        }}>
          Partnership quality dictates outcomes. We filter for depth and the
          institutional discipline to execute under pressure.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid lg:grid-cols-2" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>

        {/* Left — The Alliance */}
        <div style={{
          backgroundColor: "rgb(5 5 7)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          padding: "2.5rem",
        }}>
          {/* Column header */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            marginBottom: "2.5rem",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <CheckCircle2 style={{ width: "14px", height: "14px", color: `${GOLD}AA`, flexShrink: 0 }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
            }}>
              The Alliance
            </span>
          </div>

          {/* Alliance items */}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {ALLIANCE.map((item, i) => {
              const Icon = item.Icon;
              return (
                <li
                  key={i}
                  style={{
                    display: "flex", gap: "1.25rem", alignItems: "flex-start",
                    paddingBottom: i < ALLIANCE.length - 1 ? "2rem" : 0,
                    marginBottom: i < ALLIANCE.length - 1 ? "2rem" : 0,
                    borderBottom: i < ALLIANCE.length - 1 ? "1px solid rgba(255,255,255,0.042)" : "none",
                  }}
                >
                  <div style={{
                    width: "30px", height: "30px", flexShrink: 0,
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.018)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: "2px",
                  }}>
                    <Icon style={{ width: "13px", height: "13px", color: `${GOLD}90` }} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px", letterSpacing: "0.32em", textTransform: "uppercase",
                      color: `${GOLD}AA`,
                      marginBottom: "0.45rem",
                    }}>
                      {item.accent}
                    </div>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.65,
                      color: "rgba(255,255,255,0.72)",
                      margin: 0,
                    }}>
                      {item.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right — The Divergence */}
        <div style={{
          backgroundColor: "rgb(5 5 7)",
          padding: "2.5rem",
          display: "flex", flexDirection: "column",
        }}>
          {/* Column header */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            marginBottom: "2.5rem",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <XCircle style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.22)", flexShrink: 0 }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
            }}>
              The Divergence
            </span>
          </div>

          {/* Divergence items */}
          <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
            {DIVERGENCE.map((item, i) => (
              <li
                key={i}
                style={{
                  paddingLeft: "1.25rem",
                  paddingBottom: i < DIVERGENCE.length - 1 ? "1.5rem" : 0,
                  marginBottom: i < DIVERGENCE.length - 1 ? "1.5rem" : 0,
                  borderLeft: "1px solid rgba(255,255,255,0.08)",
                  borderBottom: i < DIVERGENCE.length - 1 ? "1px solid rgba(255,255,255,0.038)" : "none",
                }}
              >
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300, fontSize: "1.02rem", lineHeight: 1.68,
                  color: "rgba(255,255,255,0.42)",
                  margin: 0,
                  fontStyle: "italic",
                }}>
                  {item}
                </p>
              </li>
            ))}
          </ul>

          {/* Mandate — the closing statement */}
          {/* No icon. No "Notice:" prefix. The statement speaks for itself. */}
          <div style={{
            marginTop: "2.5rem",
            paddingTop: "1.5rem",
            borderTop: `1px solid ${GOLD}20`,
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300, fontSize: "1.02rem", lineHeight: 1.68,
              color: `${GOLD}CC`,
              margin: 0,
            }}>
              {MANDATE}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}