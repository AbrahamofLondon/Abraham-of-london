import React from "react";
import { Frame, Eyebrow, Headline, Body, SystemText, GOLD } from "../components/design";

export function Scene03_CategoryDeclaration() {
  return (
    <Frame>
      <Eyebrow delay={5}>Abraham of London</Eyebrow>
      <div style={{ marginTop: "24px" }} />
      <Headline delay={20} size="56px" color={GOLD}>
        Governed Decision Intelligence
      </Headline>
      <div style={{ marginTop: "30px" }} />
      <Body delay={50}>
        A decision infrastructure system for operators, executives, and institutions facing decisions they cannot afford to get wrong.
      </Body>
      <div style={{ marginTop: "40px" }} />
      <SystemText delay={90}>Decision Infrastructure for serious operators.</SystemText>
    </Frame>
  );
}
