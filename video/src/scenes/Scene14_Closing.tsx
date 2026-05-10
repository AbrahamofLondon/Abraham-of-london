import React from "react";
import { Frame, Eyebrow, Headline, Body, SystemText, FadeIn, mono, GOLD } from "../components/design";

export function Scene14_Closing() {
  return (
    <Frame>
      <Eyebrow delay={5}>Private operator review</Eyebrow>
      <div style={{ marginTop: "24px" }} />
      <Headline delay={20} size="38px">
        Is this credible enough to become a new category of decision infrastructure?
      </Headline>
      <div style={{ marginTop: "30px" }} />
      <Body delay={55}>
        I am inviting a small number of serious operators to review the corridor before wider market push. Candid feedback requested.
      </Body>
      <div style={{ marginTop: "50px" }} />
      <FadeIn delay={90}>
        <div style={{ border: `1px solid ${GOLD}40`, padding: "20px 36px", textAlign: "center" }}>
          <p style={{ ...mono, fontSize: "22px", letterSpacing: "0.06em", color: GOLD }}>
            abrahamoflondon.org/engagements/operator-pilot
          </p>
        </div>
      </FadeIn>
      <div style={{ marginTop: "40px" }} />
      <SystemText delay={120}>Candid feedback requested.</SystemText>
    </Frame>
  );
}
