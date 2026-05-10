import React from "react";
import { Frame, WordReveal, Body, SystemText } from "../components/design";

export function Scene01_Opening() {
  return (
    <Frame>
      <WordReveal words={["Evidence", "Authority", "Consequence", "Execution"]} startFrame={10} interval={30} />
      <div style={{ marginTop: "60px" }} />
      <Body delay={140}>
        Serious decisions rarely fail because leaders lack intelligence. They fail because evidence is incomplete, authority is unclear, consequences are underestimated, and execution reality is treated as an afterthought.
      </Body>
      <div style={{ marginTop: "40px" }} />
      <SystemText delay={180}>Most decisions fail before execution begins.</SystemText>
    </Frame>
  );
}
