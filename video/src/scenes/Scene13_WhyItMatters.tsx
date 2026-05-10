import React from "react";
import { Frame, CorridorNode, CorridorLine, Headline, SystemText, GOLD } from "../components/design";

export function Scene13_WhyItMatters() {
  const nodes = ["Signal", "Instrument", "Memory", "Executive Reporting", "Strategy Room", "Boardroom", "Oversight"];

  return (
    <Frame>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {nodes.map((label, i) => (
          <React.Fragment key={label}>
            <CorridorNode label={label} active delay={5 + i * 14} />
            {i < nodes.length - 1 && <CorridorLine delay={5 + i * 14 + 6} />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop: "60px" }} />
      <Headline delay={110} size="36px">
        Help serious operators make fewer weak decisions, preserve what the organisation learns, and create a governed path from signal to execution.
      </Headline>
      <div style={{ marginTop: "30px" }} />
      <SystemText delay={150} color={GOLD}>Governed Decision Intelligence.</SystemText>
    </Frame>
  );
}
