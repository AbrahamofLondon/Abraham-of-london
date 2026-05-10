import React from "react";
import { Frame, Eyebrow, Headline, Body, SystemText } from "../components/design";

export function Scene10_StrategyRoom() {
  return (
    <Frame>
      <Eyebrow delay={5}>Strategy Room</Eyebrow>
      <div style={{ marginTop: "20px" }} />
      <Headline delay={15} size="42px">
        Where the decision moves from diagnosis to intervention.
      </Headline>
      <div style={{ marginTop: "30px" }} />
      <Body delay={50}>
        The system carries evidence forward, tracks commitments, detects avoidance, and creates a checkpoint record. Execution is governed, not assumed.
      </Body>
      <div style={{ marginTop: "40px" }} />
      <SystemText delay={90}>Execution must be governed, not assumed.</SystemText>
    </Frame>
  );
}
