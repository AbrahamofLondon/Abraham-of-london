import React from "react";
import { Frame, Eyebrow, Headline, Body, BulletList, SystemText } from "../components/design";

export function Scene06_Instruments() {
  return (
    <Frame>
      <Eyebrow delay={5}>Decision Instruments</Eyebrow>
      <div style={{ marginTop: "20px" }} />
      <BulletList
        startDelay={20}
        interval={20}
        items={[
          "Decision Exposure — quantify the cost of being wrong",
          "Execution Risk — measure whether the decision survives delivery",
          "Mandate Clarity — classify who decides and where authority breaks",
          "Strategic Priority Stack — rank competing priorities under constraint",
          "Board Brief Builder — prepare board-ready structured briefs",
        ]}
      />
      <div style={{ marginTop: "40px" }} />
      <SystemText delay={130}>Each instrument writes to decision memory.</SystemText>
      <div style={{ marginTop: "16px" }} />
      <Body delay={150}>
        These are not static frameworks. Each one produces a scored, source-labelled output that can feed the wider corridor.
      </Body>
    </Frame>
  );
}
