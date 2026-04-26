import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import DecisionExposureRunner from "@/components/instruments/DecisionExposureRunner";
import MandateClarityRunner from "@/components/instruments/MandateClarityRunner";
import InterventionPathRunner from "@/components/instruments/InterventionPathRunner";
import { track } from "@/lib/analytics/track";
import type { ExposureResult } from "@/lib/instruments/decision-exposure/engine";
import type { MandateResult } from "@/lib/instruments/mandate-clarity/engine";
import type { InterventionResult } from "@/lib/instruments/intervention-path/engine";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type Stage = "exposure" | "mandate" | "intervention" | "dossier";

const OperatorPackRun: NextPage = () => {
  const [stage, setStage] = React.useState<Stage>("exposure");
  const [exposure, setExposure] = React.useState<ExposureResult | null>(null);
  const [mandate, setMandate] = React.useState<MandateResult | null>(null);
  const [intervention, setIntervention] = React.useState<InterventionResult | null>(null);

  React.useEffect(() => { track("instrument_started", { instrumentSlug: "operator-decision-pack" }); }, []);

  function handleExposure(r: ExposureResult) { setExposure(r); setStage("mandate"); }
  function handleMandate(r: MandateResult) { setMandate(r); setStage("intervention"); }
  async function handleIntervention(r: InterventionResult) {
    setIntervention(r);
    setStage("dossier");
    track("instrument_completed", { instrumentSlug: "operator-decision-pack" });
    await fetch("/api/decision-instruments/results", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instrumentSlug: "operator-decision-pack", version: "1.0", result: { exposure, mandate, intervention: r, generatedAt: new Date().toISOString() } }),
    }).catch((err) => { console.error("[instrument] Result persist failed:", err); });
  }

  const complete = stage === "dossier";

  return (
    <InstrumentShell title="Operator Decision Pack" slug="operator-decision-pack" completed={complete} nextStepLabel="Enter Strategy Room" nextStepHref="/strategy-room">
      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {(["exposure", "mandate", "intervention", "dossier"] as Stage[]).map((s, i) => (
          <div key={s} style={{ flex: 1, height: "2px", backgroundColor: i <= ["exposure", "mandate", "intervention", "dossier"].indexOf(stage) ? `${GOLD}80` : "rgba(255,255,255,0.06)" }} />
        ))}
      </div>
      <div className="flex justify-between mb-6">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: `${GOLD}60` }}>
          {stage === "exposure" ? "Step 1 — Exposure" : stage === "mandate" ? "Step 2 — Authority" : stage === "intervention" ? "Step 3 — Intervention" : "Decision Dossier"}
        </span>
        <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.20)" }}>
          {["exposure", "mandate", "intervention", "dossier"].indexOf(stage) + 1} / 4
        </span>
      </div>

      {stage === "exposure" && <DecisionExposureRunner onComplete={handleExposure} />}
      {stage === "mandate" && <MandateClarityRunner onComplete={handleMandate} />}
      {stage === "intervention" && <InterventionPathRunner onComplete={handleIntervention} />}

      {stage === "dossier" && exposure && mandate && intervention && (
        <div className="space-y-5">
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.8rem", fontWeight: 300, color: "rgba(255,255,255,0.85)" }}>
            Operator Decision Dossier
          </h2>

          {/* Exposure summary */}
          <div style={{ border: `1px solid ${GOLD}15`, padding: "0.75rem" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}55` }}>Exposure</span>
            <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.55)", marginTop: "0.2rem" }}>
              Score: {exposure.exposureScore}/100 ({exposure.exposureBand}). Weakest: {exposure.weakestDimension}.
            </p>
          </div>

          {/* Authority summary */}
          <div style={{ border: `1px solid ${GOLD}15`, padding: "0.75rem" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}55` }}>Authority</span>
            <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.55)", marginTop: "0.2rem" }}>
              Clarity: {mandate.clarityScore}/100. Authority: {mandate.authorityType}. Risk: {mandate.decisionRiskLevel}.
            </p>
            {mandate.misalignmentFlags.length > 0 && (
              <p style={{ fontSize: "0.78rem", color: "rgba(252,165,165,0.45)", marginTop: "0.2rem" }}>
                Flags: {mandate.misalignmentFlags.join("; ")}
              </p>
            )}
          </div>

          {/* Intervention summary */}
          <div style={{ border: `1px solid ${GOLD}15`, padding: "0.75rem" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}55` }}>Intervention</span>
            <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.55)", marginTop: "0.2rem" }}>
              Path: {intervention.recommendedPath}. Window: {intervention.escalationWindow} days.
            </p>
            {intervention.executionBlocked && (
              <p style={{ fontSize: "0.82rem", color: "rgba(252,165,165,0.60)", fontWeight: 500, marginTop: "0.2rem" }}>{intervention.blockReason}</p>
            )}
          </div>

          {/* Final decision */}
          <div style={{ border: `1px solid ${GOLD}25`, backgroundColor: `${GOLD}06`, padding: "1rem" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}65` }}>Final Decision</span>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.70)", marginTop: "0.25rem", fontWeight: 500 }}>
              {intervention.executionBlocked
                ? "Execution is blocked. Authority must be reconstituted before any action is valid."
                : `Recommended: ${intervention.recommendedPath}. Authority: ${mandate.authorityType}. Exposure: ${exposure.exposureBand}. Execute within ${intervention.escalationWindow} days.`}
            </p>
          </div>

          <p style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.10)", textAlign: "center" }}>
            Deterministic · Operator Decision Dossier · v1.0
          </p>
        </div>
      )}
    </InstrumentShell>
  );
};

export default OperatorPackRun;
