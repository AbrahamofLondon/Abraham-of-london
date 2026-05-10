import React from "react";
import { Frame, Eyebrow, Headline, Body, SystemText } from "../components/design";

export function Scene08_DecisionCentre() {
  return (
    <Frame>
      <Eyebrow delay={5}>Decision Centre</Eyebrow>
      <div style={{ marginTop: "20px" }} />
      <Headline delay={15} size="42px">
        Once a decision enters the system, it does not disappear after the session.
      </Headline>
      <div style={{ marginTop: "30px" }} />
      <Body delay={50}>
        It becomes a living case: remembered, revisited, compared, and governed over time. This is where the product moves from assessment into infrastructure.
      </Body>
      <div style={{ marginTop: "40px" }} />
      <SystemText delay={90}>The institution does not start from zero every time.</SystemText>
    </Frame>
  );
}
