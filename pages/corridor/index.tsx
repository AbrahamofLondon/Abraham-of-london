import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getRecommendationContext, isRecommendationContextStale, type RecommendationContextRecord } from "@/lib/intelligence/corridor/recommendation-context-store.composed";
import { recordJourneyEvent } from "@/lib/demo/record-journey-event";
import { COLORS, FONTS, caption, display, bodyText, bodyTextSm, card, primaryButton, ghostButton, hexA } from "@/lib/demo/journey-design";

interface CorridorProps {
  context: RecommendationContextRecord | null;
  stale: boolean;
  missingRecommendation: boolean;
}

export const getServerSideProps: GetServerSideProps<CorridorProps> = async (ctx) => {
  const rec = typeof ctx.query.rec === "string" ? ctx.query.rec : "";
  const context = rec ? await getRecommendationContext(rec) : null;
  return {
    props: {
      context: context ? JSON.parse(JSON.stringify(context)) : null,
      stale: context ? isRecommendationContextStale(context) : false,
      missingRecommendation: Boolean(rec && !context),
    },
  };
};

function accessLabel(mode: string): string {
  return mode === "self_serve" ? "Self-serve paid" : mode === "manual_billing" ? "Manual billing" : mode.replace(/_/g, " ");
}

function continuationHref(context: RecommendationContextRecord): string {
  if (context.accessMode === "controlled" || context.accessMode === "manual_billing") return "/engagements/operator-pilot";
  if (context.accessMode === "self_serve" || context.accessMode === "free") return context.targetRoute;
  return "/decision-instruments/signal";
}

export default function CorridorPage({ context, stale, missingRecommendation }: CorridorProps) {
  React.useEffect(() => {
    recordJourneyEvent("CORRIDOR_VIEWED", { recommendationId: context?.recommendationId, productCode: context?.targetProductCode });
  }, [context?.recommendationId, context?.targetProductCode]);

  const primaryHref = context ? continuationHref(context) : "/decision-instruments/signal";
  const primaryText = !context ? "Run Decision Signal" : context.accessMode === "controlled" || context.accessMode === "manual_billing" ? "Start governed qualification" : "Continue to next move";

  return (
    <Layout title="Product Corridor | Abraham of London" description="The governed next move from a Decision Signal reading.">
      <main style={{ minHeight: "100vh", background: COLORS.canvas, color: COLORS.ink, padding: "72px 24px 120px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "grid", gap: 22 }}>
          <div>
            <span style={caption(COLORS.goldSoft)}>Product Corridor · governed continuation</span>
            <h1 style={{ ...display, fontSize: "clamp(2.2rem,5vw,3.4rem)", marginTop: 12 }}>The next move must be earned by the evidence.</h1>
            <p style={{ ...bodyText, maxWidth: 640, marginTop: 14 }}>
              Corridor does not rank products by price. It carries forward the Signal recommendation, checks the current state, and shows the admissible continuation together with what is not yet justified.
            </p>
          </div>

          {missingRecommendation && (
            <div style={card(COLORS.rose)}>
              <span style={caption(COLORS.rose)}>Recommendation not found</span>
              <p style={{ ...bodyTextSm, marginTop: 8 }}>That recommendation reference does not exist in the durable corridor store. Re-run Signal to create a fresh recommendation context.</p>
            </div>
          )}

          {!context && !missingRecommendation && (
            <div style={card(COLORS.gold)}>
              <span style={caption(COLORS.goldSoft)}>No active recommendation</span>
              <p style={{ ...bodyTextSm, marginTop: 8 }}>Corridor needs a Signal result before it can determine the next admissible move. Starting from an empty demo state would be false precision.</p>
            </div>
          )}

          {context && (
            <>
              <section style={card(stale ? COLORS.amber : COLORS.emerald)}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <span style={caption(stale ? COLORS.amber : COLORS.emerald)}>You are here</span>
                    <p style={{ ...display, fontSize: "1.6rem", marginTop: 8 }}>Signal result: {context.pressureBand}</p>
                    <p style={{ ...bodyTextSm, marginTop: 8 }}>Recommendation {context.recommendationId} · Session v{context.sessionVersion} · State {context.stateHash.slice(0, 12)}</p>
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: stale ? COLORS.amber : COLORS.emerald, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    {stale ? "Stale recommendation" : "Current recommendation"}
                  </div>
                </div>
              </section>

              <section style={card()}>
                <span style={caption()}>What has been established</span>
                <ul style={{ margin: "10px 0 0", paddingLeft: 18, ...bodyTextSm }}>
                  {context.established.map((item) => <li key={item}>{item}</li>)}
                  {context.carryForward.map((item) => <li key={item}>Carries forward: {item}</li>)}
                </ul>
              </section>

              <section style={card(COLORS.amber)}>
                <span style={caption(COLORS.amber)}>What remains unresolved</span>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {Object.entries(context.unresolved).map(([key, value]) => value ? (
                    <div key={key} style={{ borderTop: `1px solid ${hexA(COLORS.amber, 0.18)}`, paddingTop: 10 }}>
                      <p style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: COLORS.amber, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>{key.replace(/([A-Z])/g, " $1")}</p>
                      <p style={{ ...bodyTextSm, margin: "5px 0 0", color: COLORS.body }}>{value}</p>
                    </div>
                  ) : null)}
                </div>
              </section>

              <section style={card(COLORS.emerald)}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span style={caption(COLORS.emerald)}>Next admissible move</span>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.emerald, textTransform: "uppercase", letterSpacing: "0.12em" }}>{accessLabel(context.accessMode)}</span>
                </div>
                <p style={{ ...display, fontSize: "1.45rem", marginTop: 10 }}>{context.targetLabel}</p>
                <p style={{ ...bodyTextSm, marginTop: 10 }}><strong style={{ color: COLORS.emerald }}>Why — </strong>{context.whyAdmissible}</p>
                <div style={{ marginTop: 12 }}>
                  <span style={caption(COLORS.faint)}>Evidence basis</span>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, ...bodyTextSm }}>
                    {context.evidenceBasis.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                {stale ? (
                  <p style={{ ...bodyTextSm, marginTop: 14, color: COLORS.amber }}>This recommendation is stale. Re-run Signal before continuing so the route cannot act on old state.</p>
                ) : (
                  <Link href={primaryHref} onClick={() => recordJourneyEvent(context.accessMode === "controlled" || context.accessMode === "manual_billing" ? "COMMERCIAL_CONTINUATION_STARTED" : "NEXT_MOVE_ACCEPTED", { recommendationId: context.recommendationId, productCode: context.targetProductCode })} style={{ ...primaryButton(), display: "inline-flex", marginTop: 18, textDecoration: "none" }}>
                    {primaryText}
                  </Link>
                )}
              </section>

              {context.notYetAppropriate && (
                <section style={card()}>
                  <span style={caption()}>Not yet appropriate</span>
                  <p style={{ ...bodyTextSm, marginTop: 8 }}>{context.notYetAppropriate}</p>
                </section>
              )}
            </>
          )}

          <Link href="/decision-instruments/signal" style={{ ...ghostButton(), textDecoration: "none", justifySelf: "start" }}>Run another Signal</Link>
        </div>
      </main>
    </Layout>
  );
}
