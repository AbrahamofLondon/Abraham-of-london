import React from "react";
import { Frame, Eyebrow, BulletList, Body, SystemText } from "../components/design";

export function Scene09_ExecutiveReporting() {
  return (
    <Frame>
      <Eyebrow delay={5}>Executive Reporting</Eyebrow>
      <div style={{ marginTop: "20px" }} />
      <BulletList
        startDelay={20}
        interval={20}
        items={[
          "Financial exposure",
          "Stakeholder pressure",
          "Contradiction pressure",
          "Intervention options",
          "Boardroom qualification",
        ]}
      />
      <div style={{ marginTop: "40px" }} />
      <Body delay={120}>
        The report does not merely describe the issue. It tests consequence, contradiction, stakeholder pressure, intervention readiness, and board-level exposure.
      </Body>
      <div style={{ marginTop: "30px" }} />
      <SystemText delay={160}>Executive intelligence, not decorative reporting.</SystemText>
    </Frame>
  );
}
