import React from "react";
import { Frame, Eyebrow, Headline, BulletList, SystemText, GOLD } from "../components/design";

export function Scene07_Refusal() {
  return (
    <Frame>
      <Eyebrow delay={5}>The refusal principle</Eyebrow>
      <div style={{ marginTop: "20px" }} />
      <BulletList
        startDelay={25}
        interval={22}
        color={`${GOLD}BB`}
        items={[
          "Decision case not ready.",
          "Evidence insufficient.",
          "Authority unresolved.",
          "Escalation restricted.",
        ]}
      />
      <div style={{ marginTop: "50px" }} />
      <Headline delay={110} size="36px">
        Most products are designed to keep the user moving. This system is designed to stop weak decision logic before it becomes expensive.
      </Headline>
      <div style={{ marginTop: "30px" }} />
      <SystemText delay={150}>A serious system must be able to say no.</SystemText>
    </Frame>
  );
}
