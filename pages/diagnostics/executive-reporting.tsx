import { useEffect, useState } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Link from "next/link";

import Layout from "@/components/Layout";
import ExecutiveReportingPaywall from "@/components/diagnostics/ExecutiveReportingPaywall";
import ResultEmailCapture from "@/components/diagnostics/ResultEmailCapture";
import { getProductAmountGbp, getProductDisplayPrice } from "@/lib/commercial/catalog";
import { enforceExecutiveReportingAccess } from "@/lib/diagnostics/executive-reporting-enforcement";
import { trackExecGateView } from "@/lib/analytics/journey-client";

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif" };

/* ─── Types ──────────────────────────────────────────────────────────────── */
type UserEvidence = {
  decision: string | null;
  blocker: string | null;
  consequence: string | null;
  condition: string | null;
  owner: string | null;
  pattern: string | null;
  completedAssessments: string[];
};

type LadderItem = { key: string; label: string; completed: boolean };

/* ─── Evidence loader ────────────────────────────────────────────────────── */
function loadUserEvidence(): UserEvidence {
  const result: UserEvidence = {
    decision: null, blocker: null, consequence: null,
    condition: null, owner: null, pattern: null,
    completedAssessments: [],
  };

  try {
    const checks = [
      { key: "aol_fast_result", label: "fast" },
      { key: "purpose-alignment-result", label: "purpose" },
      { key: "team-assessment-result", label: "team" },
      { key: "enterprise-assessment-result", label: "enterprise" },
    ];
    for (const c of checks) {
      if (sessionStorage.getItem(c.key)) result.completedAssessments.push(c.label);
    }

    const fast = sessionStorage.getItem("aol_fast_result");
    if (fast) {
      const parsed = JSON.parse(fast);
      const stateRaw = localStorage.getItem("aol-fast-assessment-state");
      const answers = stateRaw ? (JSON.parse(stateRaw).data?.answers ?? {}) : {};
      result.decision = answers.decision || parsed?.synthesis?.avoidedDecision || null;
      result.blocker = answers.claimedOwner === "Unclear" || answers.claimedOwner === "Shared"
        ? `ownership is ${(answers.claimedOwner ?? "unclear").toLowerCase()}`
        : null;
      result.consequence = answers.consequence || parsed?.synthesis?.defaultPathForecast || null;
      result.condition = parsed?.conditionLabel || parsed?.condition || null;
      result.owner = answers.claimedOwner || null;
      result.pattern = parsed?.anchorNarrative?.pattern || null;
    }

    const ent = sessionStorage.getItem("enterprise-assessment-result");
    if (ent) {
      const parsed = JSON.parse(ent);
      if (!result.decision) result.decision = parsed?.recentDecision || null;
      if (!result.blocker) result.blocker = parsed?.dominantFailure || null;
      if (!result.consequence) result.consequence = parsed?.primaryReading || null;
      if (!result.condition) result.condition = parsed?.band || null;
    }

    const purpose = sessionStorage.getItem("purpose-alignment-result");
    if (purpose) {
      const parsed = JSON.parse(purpose);
      if (!result.pattern) result.pattern = parsed?.primaryPattern || parsed?.anchorNarrative?.pattern || null;
      if (!result.condition) result.condition = parsed?.conditionLabel || null;
    }

    const team = sessionStorage.getItem("team-assessment-result");
    if (team) {
      const parsed = JSON.parse(team);
      if (!result.pattern) result.pattern = parsed?.patternTitle || null;
    }
  } catch { /* ignore */ }

  return result;
}

/* ─── Divider component ──────────────────────────────────────────────────── */
function GoldDivider() {
  return <div style={{ height: "1px", background: `linear-gradient(90deg, transparent 0%, ${GOLD}30 20%, ${GOLD}30 80%, transparent 100%)`, margin: "72px 0" }} />;
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function ExecutiveReportingEntryPage() {
  const router = useRouter();
  const checkoutCancelled = router.query.checkout === "cancelled";
  const accessRequired = router.query.access === "required";
  const [evidence, setEvidence] = useState<UserEvidence>({
    decision: null, blocker: null, consequence: null,
    condition: null, owner: null, pattern: null,
    completedAssessments: [],
  });
  const [ladder, setLadder] = useState<LadderItem[]>([]);
  const hasEvidence = Boolean(evidence.decision);
  const hasStrategy = evidence.completedAssessments.length >= 3;

  useEffect(() => {
    trackExecGateView();
    const ev = loadUserEvidence();
    setEvidence(ev);
    setLadder([
      { key: "fast", label: "Fast Diagnostic", completed: ev.completedAssessments.includes("fast") },
      { key: "purpose", label: "Purpose Alignment", completed: ev.completedAssessments.includes("purpose") },
      { key: "team", label: "Team Assessment", completed: ev.completedAssessments.includes("team") },
      { key: "enterprise", label: "Enterprise Assessment", completed: ev.completedAssessments.includes("enterprise") },
    ]);
  }, []);

  return (
    <Layout
      title="Executive Reporting | Abraham of London"
      description="Governed executive reporting. Translates diagnostic evidence into financial exposure, institutional constraint, and a governed priority stack."
      canonicalUrl="/diagnostics/executive-reporting"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="description" content="Executive Reporting is the consequence interpretation layer in the Abraham of London diagnostic ladder." />
      </Head>

      <main style={{ backgroundColor: "#050505", minHeight: "100vh", color: "#F5F5F5" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "140px 24px 96px" }}>

          {/* ═══ 1. OPENING VERDICT ═══ */}
          <section style={{ paddingBottom: "32px" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.30em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "28px" }}>
              Executive Reporting
            </p>
            <h1 style={{ ...serif, fontWeight: 400, fontSize: "clamp(34px, 5.5vw, 52px)", lineHeight: 1.08, letterSpacing: "-0.025em", color: "#F5F5F5" }}>
              This is not an execution problem.
            </h1>
            <p style={{ ...serif, fontWeight: 400, fontSize: "clamp(34px, 5.5vw, 52px)", lineHeight: 1.08, letterSpacing: "-0.025em", color: `${GOLD}60`, marginTop: "6px" }}>
              It is a decision structure failure.
            </p>
            <p style={{ marginTop: "28px", ...mono, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}90` }}>
              Current condition: {evidence.condition || "unresolved decision exposure"}
            </p>
          </section>

          <GoldDivider />

          {/* ═══ 2. PERSONALISED DECISION EXPOSURE ═══ */}
          <section style={{ paddingBottom: "0" }}>
            {hasEvidence ? (
              <>
                <p style={{ ...serif, fontSize: "17px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>
                  You are attempting to resolve:
                </p>
                <blockquote style={{ borderLeft: `2px solid ${GOLD}40`, paddingLeft: "20px", margin: "14px 0 0 0" }}>
                  <p style={{ ...serif, fontSize: "19px", lineHeight: 1.6, color: "#EAEAEA", fontStyle: "italic" }}>
                    &ldquo;{evidence.decision}&rdquo;
                  </p>
                </blockquote>
                {evidence.blocker && (
                  <>
                    <p style={{ ...serif, fontSize: "17px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", marginTop: "28px" }}>
                      While still operating within:
                    </p>
                    <blockquote style={{ borderLeft: `2px solid ${GOLD}40`, paddingLeft: "20px", margin: "14px 0 0 0" }}>
                      <p style={{ ...serif, fontSize: "19px", lineHeight: 1.6, color: "#EAEAEA", fontStyle: "italic" }}>
                        &ldquo;{evidence.blocker}&rdquo;
                      </p>
                    </blockquote>
                  </>
                )}
                <p style={{ ...serif, fontSize: "17px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", marginTop: "32px" }}>
                  That is why progress has stalled.
                </p>
              </>
            ) : (
              <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}06`, padding: "28px" }}>
                <p style={{ ...serif, fontSize: "17px", lineHeight: 1.75, color: "rgba(255,255,255,0.60)" }}>
                  Your diagnostic evidence indicates a decision exposure, but the underlying decision has not been named clearly enough yet.
                </p>
                <Link
                  href="/diagnostics/fast"
                  style={{ display: "inline-block", marginTop: "20px", padding: "14px 28px", border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", textDecoration: "none", minHeight: "44px" }}
                >
                  Complete Fast Diagnostic first
                </Link>
              </div>
            )}
          </section>

          <GoldDivider />

          {/* ═══ 3. CONSEQUENCE SNAPSHOT ═══ */}
          <section>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "32px" }}>
              If nothing changes
            </p>
            <div style={{ display: "grid", gap: "28px" }}>
              <div style={{ borderLeft: `2px solid ${GOLD}25`, paddingLeft: "20px" }}>
                <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}80` }}>30 days</p>
                <p style={{ ...serif, fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.58)", marginTop: "8px" }}>
                  {evidence.blocker
                    ? `You will still be managing ${evidence.blocker}. Workarounds will have replaced structure.`
                    : "The same constraint will still be active. Workarounds will have replaced structure."}
                </p>
              </div>
              <div style={{ borderLeft: `2px solid ${GOLD}35`, paddingLeft: "20px" }}>
                <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}80` }}>60 days</p>
                <p style={{ ...serif, fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.58)", marginTop: "8px" }}>
                  {evidence.consequence
                    ? `The cost shifts from operational delay to structural damage: ${evidence.consequence}`
                    : "The cost will shift from operational delay to structural inefficiency. Options that existed today are now constrained."}
                </p>
              </div>
              <div style={{ borderLeft: `2px solid ${GOLD}50`, paddingLeft: "20px" }}>
                <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}80` }}>90 days</p>
                <p style={{ ...serif, fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.58)", marginTop: "8px" }}>
                  The decision will no longer be optional. It will be forced under worse conditions.
                </p>
              </div>
            </div>
            {!hasEvidence && (
              <p style={{ marginTop: "24px", ...serif, fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
                The available evidence is not sufficient to price this fully yet.
              </p>
            )}
          </section>

          <GoldDivider />

          {/* ═══ 4. EVIDENCE ACCUMULATED ═══ */}
          <section style={{ border: `1px solid ${GOLD}18`, backgroundColor: "rgba(255,255,255,0.015)", padding: "28px" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "20px" }}>
              Evidence accumulated
            </p>
            <div style={{ display: "grid", gap: "12px" }}>
              {ladder.map((item) => (
                <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ ...serif, fontSize: "15px", color: item.completed ? "#EAEAEA" : "rgba(255,255,255,0.30)" }}>
                    {item.completed ? "✓" : "○"} {item.label}
                  </span>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: item.completed ? `${GOLD}90` : "rgba(255,255,255,0.20)" }}>
                    {item.completed ? "Completed" : "Not yet completed"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ 5. WHAT EXECUTIVE REPORTING ADDS ═══ */}
          <section style={{ padding: "64px 0" }}>
            <p style={{ ...serif, fontSize: "17px", lineHeight: 1.8, color: "rgba(255,255,255,0.55)" }}>
              The free ladder identifies the structure of the problem.
            </p>
            <p style={{ ...serif, fontSize: "17px", lineHeight: 1.8, color: "rgba(255,255,255,0.55)", marginTop: "16px" }}>
              Executive Reporting goes further:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0 0" }}>
              {[
                "prices the cost of delay",
                "identifies the governance correction",
                "sequences the first intervention",
                "prepares a board-ready decision object",
              ].map((item) => (
                <li key={item} style={{ ...serif, fontSize: "16px", lineHeight: 2.0, color: `${GOLD}BB`, paddingLeft: "20px", position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: `${GOLD}60` }}>&bull;</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* ═══ 6. PERSONALISED REPORT PREVIEW ═══ */}
          {hasEvidence && (
            <section style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}04`, padding: "32px", marginBottom: "16px" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "28px" }}>
                Preview — from your diagnostic evidence
              </p>

              <div style={{ marginBottom: "28px" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "8px" }}>
                  1. Executive decision finding
                </p>
                <p style={{ ...serif, fontSize: "16px", lineHeight: 1.7, color: "#EAEAEA" }}>
                  The unresolved decision &mdash; &ldquo;{evidence.decision}&rdquo; &mdash; is not an execution delay. It is a structural failure to assign binding authority.
                </p>
              </div>

              <div style={{ height: "1px", background: `${GOLD}15`, margin: "0 0 28px 0" }} />

              <div style={{ marginBottom: "28px" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "8px" }}>
                  2. Structural contradiction
                </p>
                <p style={{ ...serif, fontSize: "16px", lineHeight: 1.7, color: "#EAEAEA" }}>
                  {evidence.blocker
                    ? `The decision cannot resolve while ${evidence.blocker} remains the operating constraint. These two positions are incompatible.`
                    : evidence.pattern
                      ? `Pattern detected: ${evidence.pattern}. The structural contradiction has been identified but requires full analysis.`
                      : "Contradiction mapping requires additional diagnostic evidence."}
                </p>
              </div>

              <div style={{ height: "1px", background: `${GOLD}15`, margin: "0 0 28px 0" }} />

              <div>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "8px" }}>
                  3. Cost of inaction
                </p>
                <p style={{ ...serif, fontSize: "16px", lineHeight: 1.7, color: "#EAEAEA" }}>
                  {evidence.consequence
                    ? `If nothing changes: ${evidence.consequence}. The full financial and structural exposure is calculated in the report.`
                    : "Cost of inaction requires full Executive Reporting analysis to price accurately."}
                </p>
              </div>
            </section>
          )}

          <GoldDivider />

          {/* ═══ 7. HOW THIS WAS DETERMINED ═══ */}
          <details style={{ border: `1px solid ${GOLD}15`, backgroundColor: "rgba(255,255,255,0.015)", padding: "24px 28px", marginBottom: "64px" }}>
            <summary style={{ cursor: "pointer", ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}80` }}>
              How this was determined
            </summary>
            <p style={{ marginTop: "20px", ...serif, fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.60)" }}>
              The system combined the decision you surfaced, the constraint that has preserved it, and the consequence attached to delay. Executive Reporting exists because that evidence now points to a structural issue rather than a local execution miss.
            </p>
          </details>

          {/* ═══ EMAIL CAPTURE — ABOVE PAYWALL ═══ */}
          <section style={{ marginBottom: "64px" }}>
            <ResultEmailCapture source="executive_reporting_gate" />
          </section>

          {/* ═══ 8. PAYWALL ═══ */}
          <section style={{ paddingBottom: "32px" }}>
            <p style={{ ...serif, fontSize: "20px", lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
              You have seen the diagnosis.
            </p>
            <p style={{ ...serif, fontSize: "20px", lineHeight: 1.6, color: "rgba(255,255,255,0.40)", marginTop: "4px" }}>
              You have not yet seen the full consequence.
            </p>
          </section>

          <ExecutiveReportingPaywall
            price={getProductAmountGbp("executive_reporting")}
            ctaHref="/diagnostics/executive-reporting/run"
            checkoutPriceCode="executive_reporting"
            primaryCtaLabel="Generate executive report"
            secondaryHref="/diagnostics"
            secondaryLabel="Return to diagnostic ladder"
            eyebrow={`Executive Reporting · ${getProductDisplayPrice("executive_reporting")}`}
            title="For decisions that require board-grade clarity."
            description="The diagnostic ladder accumulates structural evidence. Executive Reporting translates that evidence into consequence: financial exposure, institutional constraint, and the priority decisions that follow."
            sampleLines={[
              { label: "Position statement", value: "Execution coherence collapsing under governance drift" },
              { label: "Financial exposure", value: "Scenario projection derived from your stated inputs (example only)" },
              { label: "Priority stack", value: "Re-establish authority clarity → collapse redundant reporting → stabilise execution cadence" },
            ]}
          />

          {(checkoutCancelled || accessRequired) && (
            <div style={{ marginTop: "24px", padding: "24px", borderLeft: `2px solid ${GOLD}40`, background: "rgba(255,255,255,0.02)" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}80` }}>
                {checkoutCancelled ? "Session cancelled" : "Access required"}
              </p>
              <p style={{ ...serif, fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "10px" }}>
                {checkoutCancelled
                  ? "No payment was taken. You can return to the free ladder or restart Executive Reporting when ready."
                  : "Executive Reporting is the consequence interpretation layer. Complete checkout to continue into the intake."}
              </p>
            </div>
          )}

          <GoldDivider />

          {/* ═══ 9. STRATEGY ROOM BRIDGE ═══ */}
          <section style={{ paddingBottom: "48px" }}>
            {hasStrategy ? (
              <>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "16px" }}>
                  Qualified for intervention
                </p>
                <p style={{ ...serif, fontSize: "18px", lineHeight: 1.7, color: "rgba(255,255,255,0.65)" }}>
                  This now qualifies for controlled intervention.
                </p>
                <p style={{ ...serif, fontSize: "18px", lineHeight: 1.7, color: "rgba(255,255,255,0.75)", marginTop: "8px" }}>
                  Move this into a Strategy Room session.
                </p>
                <a
                  href="/strategy-room"
                  style={{ display: "inline-block", marginTop: "24px", padding: "16px 32px", backgroundColor: `${GOLD}`, color: "#0B0B0B", ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none", fontWeight: 600, minHeight: "44px" }}
                >
                  Move into Strategy Room
                </a>
              </>
            ) : (
              <>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "16px" }}>
                  Strategy Room
                </p>
                <p style={{ ...serif, fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.40)" }}>
                  More diagnostic evidence is required before Strategy Room access can be considered.
                </p>
                <Link
                  href="/diagnostics"
                  style={{ display: "inline-block", marginTop: "16px", padding: "14px 24px", border: `1px solid ${GOLD}25`, color: `${GOLD}80`, ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", minHeight: "44px" }}
                >
                  Return to diagnostic ladder
                </Link>
              </>
            )}
          </section>

          {/* ═══ SOCIAL PROOF ═══ */}
          <div style={{ borderTop: `1px solid ${GOLD}12`, paddingTop: "32px" }}>
            <p style={{ ...serif, fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.30)", fontStyle: "italic" }}>
              This pattern is commonly seen before structural correction. This reading can be tracked over time. Re-evaluate in 14 days to see whether the pattern improves or repeats.
            </p>
          </div>

        </div>
      </main>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const accessDecision = await enforceExecutiveReportingAccess({
    email: typeof ctx.query.email === "string" ? ctx.query.email : null,
    subjectId: typeof ctx.query.subjectId === "string" ? ctx.query.subjectId : null,
    campaignId: typeof ctx.query.campaignId === "string" ? ctx.query.campaignId : null,
    intakeMode: typeof ctx.query.intakeMode === "string" ? ctx.query.intakeMode : "ladder",
    sponsoredDirect: ctx.query.sponsoredDirect === "true",
    sponsorNameOrSeat: typeof ctx.query.sponsor === "string" ? ctx.query.sponsor : null,
    monitoringAccountId:
      typeof ctx.query.monitoringAccountId === "string" ? ctx.query.monitoringAccountId : null,
    monitoringContext: ctx.query.monitoring === "true",
  });

  if (!accessDecision.allowed) {
    return {
      redirect: {
        destination: `${accessDecision.requiredPath || "/diagnostics/constitutional-diagnostic"}?executive=blocked`,
        permanent: false,
      },
    };
  }

  return { props: {} };
};
