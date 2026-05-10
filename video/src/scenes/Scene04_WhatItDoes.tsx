import React from "react";
import { Frame, Eyebrow, CorridorNode, CorridorLine, Body, SystemText } from "../components/design";

export function Scene04_WhatItDoes() {
  const nodes = ["Signal", "Instrument", "Executive Reporting", "Strategy Room", "Boardroom", "Oversight"];

  return (
    <Frame>
      <Eyebrow delay={5}>The corridor</Eyebrow>
      <div style={{ marginTop: "40px", display: "flex", alignItems: "center", gap: "12px" }}>
        {nodes.map((label, i) => (
          <React.Fragment key={label}>
            <CorridorNode label={label} active delay={10 + i * 18} />
            {i < nodes.length - 1 && <CorridorLine delay={10 + i * 18 + 8} />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop: "50px" }} />
      <Body delay={120}>
        The system does not begin by selling a service. It begins by testing a decision condition. If the evidence is weak, the system can restrict progression.
      </Body>
      <div style={{ marginTop: "30px" }} />
      <SystemText delay={160}>Progression is earned by evidence.</SystemText>
    </Frame>
  );
}
