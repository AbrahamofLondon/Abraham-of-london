import React from "react";
import { Frame, Eyebrow, Headline, Body, BulletList, SystemText, FadeIn, mono, GOLD, FAINT } from "../components/design";

export function Scene05_FastDiagnostic() {
  return (
    <Frame>
      <Eyebrow delay={5}>Fast Diagnostic</Eyebrow>
      <div style={{ marginTop: "20px" }} />
      <Headline delay={15} size="40px">90-second condition classification.</Headline>
      <div style={{ marginTop: "30px" }} />
      <Body delay={40}>
        A decision is submitted, challenged, classified, and converted into a governed record. This is not a personality test. It is a condition reading.
      </Body>
      <div style={{ marginTop: "40px" }} />
      <FadeIn delay={80}>
        <div style={{ border: `1px solid ${GOLD}40`, padding: "36px 44px", maxWidth: "640px" }}>
          <p style={{ ...mono, fontSize: "16px", letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD }}>System reading</p>
          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <p style={{ ...mono, fontSize: "20px", color: "rgba(252,165,165,0.85)" }}>Decision pressure detected</p>
            <p style={{ ...mono, fontSize: "20px", color: FAINT }}>Evidence posture: thin</p>
            <p style={{ ...mono, fontSize: "20px", color: GOLD }}>Required move: clarify authority before escalation</p>
          </div>
        </div>
      </FadeIn>
    </Frame>
  );
}
