import React from "react";
import { Frame, Eyebrow, Headline, ThreeColumns, SystemText } from "../components/design";

export function Scene02_CategoryProblem() {
  return (
    <Frame>
      <Eyebrow delay={5}>The category problem</Eyebrow>
      <div style={{ marginTop: "30px" }} />
      <ThreeColumns
        startDelay={20}
        columns={[
          { header: "Consulting", items: ["Recommendation without retained memory"] },
          { header: "Dashboards", items: ["Visibility without decision authority"] },
          { header: "AI Assistants", items: ["Suggestions without governance"] },
        ]}
      />
      <div style={{ marginTop: "50px" }} />
      <SystemText delay={100}>The missing layer is governed decision intelligence.</SystemText>
    </Frame>
  );
}
