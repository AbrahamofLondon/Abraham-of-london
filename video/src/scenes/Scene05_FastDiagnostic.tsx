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
        <div style={{ border: `1px solid ${GOLD}30`, padding: "28px 36px", maxWidth: "500px" }}>
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88` }}>System reading</p>
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <p style={{ ...mono, fontSize: "13px", color: "rgba(252,165,165,0.65)" }}>Decision pressure detected</p>
            <p style={{ ...mono, fontSize: "13px", color: FAINT }}>Evidence posture: thin</p>
            <p style={{ ...mono, fontSize: "13px", color: `${GOLD}AA` }}>Required move: clarify authority before escalation</p>
          </div>
        </div>
      </FadeIn>
    </Frame>
  );
}
