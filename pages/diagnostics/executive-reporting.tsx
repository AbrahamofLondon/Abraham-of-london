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

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif" };

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

function loadUserEvidence(): UserEvidence {
  const result: UserEvidence = {
    decision: null, blocker: null, consequence: null,
    condition: null, owner: null, pattern: null,
    completedAssessments: [],
  };

  try {
    // Completed assessments
    const checks = [
      { key: "aol_fast_result", label: "fast" },
      { key: "purpose-alignment-result", label: "purpose" },
      { key: "team-assessment-result", label: "team" },
      { key: "enterprise-assessment-result", label: "enterprise" },
    ];
    for (const c of checks) {
      if (sessionStorage.getItem(c.key)) result.completedAssessments.push(c.label);
    }

    // Fast diagnostic — primary evidence source
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

    // Enterprise result — supplement or fallback
    const ent = sessionStorage.getItem("enterprise-assessment-result");
    if (ent) {
      const parsed = JSON.parse(ent);
      if (!result.decision) result.decision = parsed?.recentDecision || null;
      if (!result.blocker) result.blocker = parsed?.dominantFailure || null;
      if (!result.consequence) result.consequence = parsed?.primaryReading || null;
      if (!result.condition) result.condition = parsed?.band || null;
    }

    // Purpose alignment — supplement
    const purpose = sessionStorage.getItem("purpose-alignment-result");
    if (purpose) {
      const parsed = JSON.parse(purpose);
      if (!result.pattern) result.pattern = parsed?.primaryPattern || parsed?.anchorNarrative?.pattern || null;
      if (!result.condition) result.condition = parsed?.conditionLabel || null;
    }

    // Team assessment — supplement
    const team = sessionStorage.getItem("team-assessment-result");
    if (team) {
      const parsed = JSON.parse(team);
      if (!result.pattern) result.pattern = parsed?.patternTitle || null;
    }
  } catch { /* ignore */ }

  return result;
}

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

      <main style={{ backgroundColor: "#0B0B0B", minHeight: "100vh", color: "#F5F5F5" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "120px 24px 96px" }}>

          {/* ═══ 1. OPENING VERDICT ═══ */}
          <div style={{ paddingBottom: "80px" }}>
            <h1 style={{ ...serif, fontWeight: 500, fontSize: "clamp(32px, 5vw, 48px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "#F5F5F5" }}>
              This is not an execution problem.
            </h1>
            <p style={{ ...serif, fontWeight: 500, fontSize: "clamp(32px, 5vw, 48px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
              It is a decision structure failure.
            </p>
            <p style={{ marginTop: "24px", ...mono, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>
              Current condition: {evidence.condition || "unresolved decision exposure"}
            </p>
          </div>

          {/* ═══ 2. PERSONALISED PRECISION STRIKE ═══ */}
          <div style={{ paddingBottom: "64px" }}>
            {hasEvidence ? (
              <>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#777" }}>
                  You are attempting to resolve:
                </p>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#EAEAEA", paddingLeft: "14px", marginTop: "8px" }}>
                  &ldquo;{evidence.decision}&rdquo;
                </p>
                {evidence.blocker && (
                  <>
                    <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#777", marginTop: "20px" }}>
                      While still operating within:
                    </p>
                    <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#EAEAEA", paddingLeft: "14px", marginTop: "8px" }}>
                      &ldquo;{evidence.blocker}&rdquo;
                    </p>
                  </>
                )}
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#777", marginTop: "24px" }}>
                  That is why progress has stalled.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.60)" }}>
                  Your diagnostic evidence indicates a decision exposure, but the underlying decision has not been named clearly enough yet.
                </p>
                <Link
                  href="/diagnostics/fast"
                  style={{ display: "inline-block", marginTop: "16px", padding: "12px 22px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.70)", ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}
                >
                  Complete Fast Diagnostic first
                </Link>
              </>
            )}
          </div>

          {/* ═══ 3. CONSEQUENCE SNAPSHOT ═══ */}
          <div style={{ paddingBottom: "72px" }}>
            <div style={{ marginBottom: "24px" }}>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>If nothing changes</p>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>30 days</p>
              <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>
                {evidence.blocker
                  ? `You will still be managing ${evidence.blocker}. Workarounds will have replaced structure.`
                  : "The same constraint will still be active. Workarounds will have replaced structure."}
              </p>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>60 days</p>
              <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>
                {evidence.consequence
                  ? `The cost shifts from operational delay to structural damage: ${evidence.consequence}`
                  : "The cost will shift from operational delay to structural inefficiency. Options that existed today are now constrained."}
              </p>
            </div>
            <div style={{ marginBottom: "32px" }}>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>90 days</p>
              <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>
                The decision will no longer be optional. It will be forced under worse conditions.
              </p>
            </div>
            {!hasEvidence && (
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
                The available evidence is not sufficient to price this fully yet.
              </p>
            )}
          </div>

          {/* ═══ 4. LADDER EVIDENCE ═══ */}
          <div style={{ background: "#111", padding: "24px 28px", marginBottom: "64px", border: "1px solid #1c1c1c" }}>
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#666" }}>
              Evidence accumulated
            </p>
            <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
              {ladder.map((item) => (
                <div key={item.key} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px", lineHeight: 1.6, color: item.completed ? "#EAEAEA" : "#666" }}>
                  <span>{item.completed ? "✓" : "○"} {item.label}</span>
                  <span>{item.completed ? "Completed" : "Not yet completed"}</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: "16px", fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)" }}>
              The ladder has accumulated evidence. Executive Reporting is the layer that turns that evidence into consequence, sequencing, and a governed decision position.
            </p>
          </div>

          {/* ═══ 5. WHAT EXECUTIVE REPORTING ADDS ═══ */}
          <div style={{ paddingBottom: "64px" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)" }}>
              The free ladder identifies the structure of the problem.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)", marginTop: "16px" }}>
              Executive Reporting goes further:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0 0" }}>
              {[
                "prices the cost of delay",
                "identifies the governance correction",
                "sequences the first intervention",
                "prepares a board-ready decision object",
              ].map((item) => (
                <li key={item} style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.60)", paddingLeft: "16px", marginBottom: "4px" }}>
                  &bull; {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ═══ 6. PERSONALISED PREVIEW BEFORE PAYWALL ═══ */}
          {hasEvidence && (
            <div style={{ background: "#111", padding: "28px", borderLeft: "2px solid #444", marginBottom: "64px" }}>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#666", marginBottom: "24px" }}>
                Preview — from your evidence
              </p>

              <div style={{ marginBottom: "20px" }}>
                <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#555", marginBottom: "6px" }}>
                  1. Executive decision finding
                </p>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#EAEAEA" }}>
                  {evidence.decision
                    ? `The unresolved decision — "${evidence.decision}" — is not an execution delay. It is a structural failure to assign binding authority.`
                    : "Decision finding pending full evidence."}
                </p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#555", marginBottom: "6px" }}>
                  2. Structural contradiction
                </p>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#EAEAEA" }}>
                  {evidence.blocker
                    ? `The decision cannot resolve while ${evidence.blocker} remains the operating constraint. These two positions are incompatible.`
                    : evidence.pattern
                      ? `Pattern detected: ${evidence.pattern}. The structural contradiction has been identified but requires full analysis.`
                      : "Contradiction mapping requires additional diagnostic evidence."}
                </p>
              </div>

              <div>
                <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#555", marginBottom: "6px" }}>
                  3. Cost of inaction
                </p>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#EAEAEA" }}>
                  {evidence.consequence
                    ? `If nothing changes: ${evidence.consequence}. The full financial and structural exposure is calculated in the report.`
                    : "Cost of inaction requires full Executive Reporting analysis to price accurately."}
                </p>
              </div>
            </div>
          )}

          {/* ═══ 7. EMAIL CAPTURE ═══ */}
          <div style={{ marginBottom: "64px" }}>
            <ResultEmailCapture source="executive_reporting_gate" />
          </div>

          {/* ═══ 8. PAYWALL ═══ */}
          <div style={{ paddingBottom: "64px" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)" }}>
              You have seen the diagnosis.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)", marginTop: "4px" }}>
              You have not yet seen the full consequence.
            </p>
          </div>

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
              { label: "Financial exposure", value: "£420,000 estimated loss over 6 months" },
              { label: "Priority stack", value: "Re-establish authority clarity → collapse redundant reporting → stabilise execution cadence" },
            ]}
          />

          {(checkoutCancelled || accessRequired) && (
            <div style={{ marginTop: "24px", padding: "20px", borderLeft: "2px solid #444", background: "#111" }}>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#888" }}>
                {checkoutCancelled ? "Session cancelled" : "Access required"}
              </p>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "8px" }}>
                {checkoutCancelled
                  ? "No payment was taken. You can return to the free ladder or restart Executive Reporting when ready."
                  : "Executive Reporting is the consequence interpretation layer. Complete checkout to continue into the intake."}
              </p>
            </div>
          )}

          {/* ═══ 9. STRATEGY ROOM BRIDGE ═══ */}
          <div style={{ height: "1px", background: "#222", margin: "96px 0 48px" }} />

          {hasStrategy ? (
            <div style={{ paddingBottom: "48px" }}>
              <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)" }}>
                This now qualifies for controlled intervention.
              </p>
              <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.70)", marginTop: "12px" }}>
                Move this into a Strategy Room session.
              </p>
              <a
                href="/strategy-room"
                style={{ display: "inline-block", marginTop: "20px", padding: "16px 28px", backgroundColor: "#F5F5F5", color: "#0B0B0B", ...mono, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", fontWeight: 500 }}
              >
                Move into Strategy Room
              </a>
            </div>
          ) : (
            <div style={{ paddingBottom: "48px" }}>
              <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.45)" }}>
                More diagnostic evidence is required before Strategy Room access can be considered.
              </p>
              <Link
                href="/diagnostics"
                style={{ display: "inline-block", marginTop: "16px", padding: "12px 22px", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.50)", ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}
              >
                Return to diagnostic ladder
              </Link>
            </div>
          )}

          <div style={{ background: "#111", padding: "24px 28px", borderLeft: "2px solid #444", marginBottom: "48px" }}>
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#666" }}>
              How this was determined
            </p>
            <p style={{ marginTop: "16px", fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
              The system combined the decision you surfaced, the constraint that has preserved it, and the consequence attached to delay. Executive Reporting exists because that evidence now points to a structural issue rather than a local execution miss.
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
