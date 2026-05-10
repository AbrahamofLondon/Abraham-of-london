import React from "react";
import { Frame, Eyebrow, Headline, Body, SystemText, FadeIn, mono, GOLD, FAINT } from "../components/design";

export function Scene11_BoardroomOversight() {
  return (
    <Frame>
      <div style={{ display: "flex", gap: "40px", width: "100%", maxWidth: "900px" }}>
        <FadeIn delay={10}>
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "32px", flex: 1 }}>
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88` }}>Boardroom</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 300, color: "rgba(255,255,255,0.65)", marginTop: "16px", lineHeight: 1.5 }}>
              Produces the dossier. Board-level decision presentation with structured objection handling.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={40}>
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "32px", flex: 1 }}>
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88` }}>Oversight</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 300, color: "rgba(255,255,255,0.65)", marginTop: "16px", lineHeight: 1.5 }}>
              Preserves cadence, memory, suppression boundaries, outcome history, and continuity risk.
            </p>
          </div>
        </FadeIn>
      </div>
      <div style={{ marginTop: "50px" }} />
      <SystemText delay={80}>The retained value is institutional memory.</SystemText>
    </Frame>
  );
}
