import { useEffect, useState } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import ExecutiveReportingPaywall from "@/components/diagnostics/ExecutiveReportingPaywall";
import { getProductAmountGbp, getProductDisplayPrice } from "@/lib/commercial/catalog";
import { enforceExecutiveReportingAccess } from "@/lib/diagnostics/executive-reporting-enforcement";
import { trackExecGateView } from "@/lib/analytics/journey-client";

type UserEvidence = {
  decision: string | null;
  blocker: string | null;
  consequence: string | null;
  condition: string | null;
  owner: string | null;
};

function loadUserEvidence(): UserEvidence {
  const empty: UserEvidence = { decision: null, blocker: null, consequence: null, condition: null, owner: null };
  try {
    // Try fast diagnostic result first
    const fast = sessionStorage.getItem("aol_fast_result");
    if (fast) {
      const parsed = JSON.parse(fast);
      const answers = JSON.parse(localStorage.getItem("aol_fast_draft") ?? "{}").answers ?? {};
      return {
        decision: answers.decision || parsed?.synthesis?.avoidedDecision || null,
        blocker: answers.claimedOwner === "Unclear" || answers.claimedOwner === "Shared" ? `ownership is ${(answers.claimedOwner ?? "unclear").toLowerCase()}` : null,
        consequence: answers.consequence || parsed?.synthesis?.defaultPathForecast || null,
        condition: parsed?.conditionLabel || parsed?.condition || null,
        owner: answers.claimedOwner || null,
      };
    }
    // Try enterprise result
    const ent = sessionStorage.getItem("enterprise-assessment-result");
    if (ent) {
      const parsed = JSON.parse(ent);
      return {
        decision: parsed?.recentDecision || null,
        blocker: parsed?.dominantFailure || null,
        consequence: parsed?.primaryReading || null,
        condition: parsed?.band || null,
        owner: null,
      };
    }
  } catch { /* ignore */ }
  return empty;
}

export default function ExecutiveReportingEntryPage() {
  const router = useRouter();
  const checkoutCancelled = router.query.checkout === "cancelled";
  const accessRequired = router.query.access === "required";
  const [evidence, setEvidence] = useState<UserEvidence>({ decision: null, blocker: null, consequence: null, condition: null, owner: null });

  useEffect(() => {
    trackExecGateView();
    setEvidence(loadUserEvidence());
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

          {/* ═══ 1. HERO — VERDICT, NOT HEADLINE ═══ */}
          <div style={{ paddingBottom: "80px" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 500, fontSize: "clamp(32px, 5vw, 48px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "#F5F5F5" }}>
              This is not an execution problem.
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 500, fontSize: "clamp(32px, 5vw, 48px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
              It is a decision structure failure.
            </p>
            {evidence.condition && (
              <p style={{ marginTop: "24px", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>
                Current condition: {evidence.condition}
              </p>
            )}
          </div>

          {/* ═══ 2. PRECISION STRIKE ═══ */}
          <div style={{ paddingBottom: "64px" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#777" }}>
              You are attempting to:
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#EAEAEA", paddingLeft: "14px", marginTop: "8px" }}>
              {evidence.decision ? `"${evidence.decision}"` : "A decision identified through your diagnostic journey"}
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#777", marginTop: "20px" }}>
              While operating within:
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#EAEAEA", paddingLeft: "14px", marginTop: "8px" }}>
              {evidence.blocker ? `"${evidence.blocker}"` : "A constraint that has prevented resolution"}
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#777", marginTop: "24px" }}>
              This is why progress has stalled.
            </p>
          </div>

          {/* ═══ 3. WHY IT EXISTS ═══ */}
          <div style={{ paddingBottom: "64px" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)" }}>
              The issue is not the absence of effort.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)", marginTop: "16px" }}>
              The structure governing the decision has not changed. Prior attempts have not altered the condition because they addressed symptoms, not the structural constraint.
            </p>
          </div>

          {/* ═══ 4. PATTERN RECOGNITION ═══ */}
          <div style={{ height: "1px", background: "#1A1A1A", margin: "48px 0" }} />
          <div style={{ paddingBottom: "64px" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)" }}>
              This is not isolated.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)", marginTop: "16px" }}>
              This pattern appears when a decision requires authority, but execution continues under shared or unclear control.
            </p>
          </div>

          {/* ═══ 5. CONTRADICTION — THE ONLY FRAMED SECTION ═══ */}
          <div style={{ background: "#111", padding: "24px 28px", borderLeft: "2px solid #444", marginBottom: "64px" }}>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#777" }}>
              The diagnostic evidence shows:
            </p>
            <div style={{ marginTop: "16px" }}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#666", marginBottom: "4px" }}>Decision</p>
              <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#EAEAEA" }}>
                {evidence.decision ? `"${evidence.decision}"` : "The decision that must be made — identified from your diagnostic journey"}
              </p>
            </div>
            <div style={{ marginTop: "20px" }}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#666", marginBottom: "4px" }}>Constraint</p>
              <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#EAEAEA" }}>
                {evidence.blocker ? `"${evidence.blocker}"` : "The competing structure that prevents resolution"}
              </p>
            </div>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "24px" }}>
              These cannot coexist. One of them must give way.
            </p>
          </div>

          {/* ═══ 6. COST OF INACTION ═══ */}
          <div style={{ paddingBottom: "72px" }}>
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>30 days</p>
              <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>
                {evidence.blocker
                  ? `You will still be managing ${evidence.blocker}. Workarounds will have replaced structure.`
                  : "You will still be managing the same blocker. Workarounds will have replaced structure."}
              </p>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>60 days</p>
              <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>
                The cost will shift from operational delay to structural inefficiency. Options that existed today are now constrained.
              </p>
            </div>
            <div style={{ marginBottom: "32px" }}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555" }}>90 days</p>
              <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>
                The decision will no longer be optional. It will be forced under worse conditions.
              </p>
            </div>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.70)", marginTop: "32px" }}>
              At this point, delay is no longer neutral.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.70)", marginTop: "4px" }}>
              It is a decision.
            </p>
          </div>

          {/* ═══ 7. BOARD VIEW ═══ */}
          <div style={{ maxWidth: "600px", paddingBottom: "72px", paddingLeft: "16px" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.55)" }}>
              From a board or investor perspective:
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.55)", marginTop: "16px" }}>
              This does not appear as complexity.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.70)", marginTop: "8px" }}>
              It appears as a decision not yet taken.
            </p>
          </div>

          {/* ═══ 8. REQUIRED MOVE ═══ */}
          <div style={{ paddingBottom: "72px" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.60)", marginBottom: "12px" }}>
              Required:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {["Assign a single accountable owner", "Remove the competing obligation", "Commit to a defined timeline"].map((item) => (
                <li key={item} style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.60)", paddingLeft: "16px", marginBottom: "4px" }}>
                  &bull; {item}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.45)", marginTop: "16px" }}>
              Until this happens, execution will continue to stall.
            </p>
          </div>

          {/* ═══ 9. CONSEQUENCE SNAPSHOT ═══ */}
          <div style={{ paddingBottom: "80px" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)" }}>
              You now have visibility.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.45)", marginTop: "8px" }}>
              What you do not yet have is resolution.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.45)", marginTop: "16px" }}>
              If nothing changes, you will continue to operate inside the same constraint, with increasing cost and decreasing control.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.65)", marginTop: "24px" }}>
              You are now at the point where clarity is no longer the issue.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.65)", marginTop: "4px" }}>
              Execution is.
            </p>
          </div>

          {/* ═══ 10. EXECUTIVE REPORTING PAYWALL ═══ */}
          <ExecutiveReportingPaywall
            price={getProductAmountGbp("executive_reporting")}
            ctaHref="/diagnostics/executive-reporting/run"
            checkoutPriceCode="executive_reporting"
            primaryCtaLabel="See the cost you are already paying"
            secondaryHref="/diagnostics"
            secondaryLabel="Return to diagnostic ladder"
            eyebrow={`Executive Reporting · ${getProductDisplayPrice("executive_reporting")}`}
            title="Where diagnostic evidence becomes a governed position."
            description="The diagnostic ladder accumulates structural evidence. Executive Reporting translates that evidence into consequence: financial exposure, institutional constraint, and the priority decisions that follow."
            sampleLines={[
              { label: "Position statement", value: "Execution coherence collapsing under governance drift" },
              { label: "Financial exposure", value: "£420,000 estimated loss over 6 months" },
              { label: "Priority stack", value: "Re-establish authority clarity → collapse redundant reporting → stabilise execution cadence" },
            ]}
          />

          {(checkoutCancelled || accessRequired) && (
            <div style={{ marginTop: "24px", padding: "20px", borderLeft: "2px solid #444", background: "#111" }}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#888" }}>
                {checkoutCancelled ? "Session cancelled" : "Access required"}
              </p>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "8px" }}>
                {checkoutCancelled
                  ? "No payment was taken. You can return to the free ladder or restart Executive Reporting when ready."
                  : "Executive Reporting is the consequence interpretation layer. Complete checkout to continue into the intake."}
              </p>
            </div>
          )}

          {/* ═══ 11. PAYMENT BLOCK ═══ */}
          <div style={{ height: "1px", background: "#222", margin: "96px 0 48px" }} />

          <div style={{ paddingBottom: "48px" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.55)" }}>
              At this point, there are only two paths:
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.70)", marginTop: "16px" }}>
              1. Leave with clarity and return to delay
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.70)", marginTop: "4px" }}>
              2. Remove the hesitation and force the decision through
            </p>
          </div>

          <div style={{ paddingBottom: "32px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#888" }}>
              Decision Enforcement Session
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontSize: "32px", fontWeight: 300, color: "rgba(255,255,255,0.90)", marginTop: "8px" }}>
              &pound;1,250
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "8px" }}>
              One decision. No drift. No ambiguity left unresolved.
            </p>
          </div>

          <div style={{ paddingBottom: "48px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#888" }}>
              Multi-Decision Intervention
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontSize: "32px", fontWeight: 300, color: "rgba(255,255,255,0.90)", marginTop: "8px" }}>
              &pound;2,500+
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "8px" }}>
              For structurally linked decisions.
            </p>
          </div>

          <a
            href="/strategy-room"
            style={{ display: "block", width: "100%", padding: "18px 0", textAlign: "center", backgroundColor: "#F5F5F5", color: "#0B0B0B", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", fontWeight: 500 }}
          >
            Enter Strategy Room
          </a>

          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.35)", marginTop: "32px" }}>
            If the cost of delay is already visible, this is the point where you stop paying it.
          </p>

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
