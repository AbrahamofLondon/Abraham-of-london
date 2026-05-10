import React from "react";
import { Frame, Eyebrow, BulletList, Body, SystemText, FAINT } from "../components/design";

export function Scene12_NotClaimed() {
  return (
    <Frame>
      <Eyebrow delay={5}>What is not claimed</Eyebrow>
      <div style={{ marginTop: "20px" }} />
      <BulletList
        startDelay={20}
        interval={18}
        color={FAINT}
        items={[
          "Fully autonomous governance",
          "Guaranteed outcomes",
          "Sector benchmarks without sample",
          "Unlimited access",
          "Hidden magic",
        ]}
      />
      <div style={{ marginTop: "50px" }} />
      <Body delay={110}>
        The system is deliberately bounded. It uses automation where governance benefits from automation, and human review where judgement is required.
      </Body>
      <div style={{ marginTop: "30px" }} />
      <SystemText delay={150}>Credibility is part of the product.</SystemText>
    </Frame>
  );
}
