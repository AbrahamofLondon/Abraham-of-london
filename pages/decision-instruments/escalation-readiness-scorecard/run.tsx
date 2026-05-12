import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import EscalationReadinessRunner from "@/components/instruments/EscalationReadinessRunner";
import { track } from "@/lib/analytics/track";
import type { EscalationResult } from "@/lib/instruments/escalation-readiness-scorecard/engine";
import { buildInstrumentSignalAuthority } from "@/lib/product/instrument-signal-authority";

const EscalationReadinessRun: NextPage = () => {
  const [result, setResult] = React.useState<EscalationResult | null>(null);
  const [resultKey, setResultKey] = React.useState<string | null>(null);

  React.useEffect(() => { track("instrument_started", { instrumentSlug: "escalation-readiness-scorecard" }); }, []);

  async function handleComplete(r: EscalationResult) {
    setResult(r);
    track("instrument_result_saved", { instrumentSlug: "escalation-readiness-scorecard", decisionState: r.readinessBand });
    try {
      const res = await fetch("/api/decision-instruments/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrumentSlug: "escalation-readiness-scorecard", version: r.version, scores: r.dimensionScores, result: r }),
      });
      const data = await res.json();
      if (data.journeyKey) setResultKey(data.journeyKey);
    } catch (err) { console.error("[instrument] Result persist failed:", err); }
  }

  const nextHref = resultKey
    ? `/diagnostics/executive-reporting?instrumentResultId=${encodeURIComponent(resultKey)}`
    : "/diagnostics/executive-reporting";

  return (
    <InstrumentShell
      title="Escalation Readiness Scorecard"
      slug="escalation-readiness-scorecard"
      completed={!!result}
      pdfHref="/api/downloads/instrument-pdf?slug=escalation-readiness-scorecard"
      nextStepLabel={result?.recommendedEscalation === "STRATEGY_ROOM" ? "Enter Strategy Room" : "Analyse institutional consequence"}
      nextStepHref={result?.recommendedEscalation === "STRATEGY_ROOM" ? "/strategy-room" : nextHref}
      signalAuthority={result ? buildInstrumentSignalAuthority("escalation-readiness-scorecard", result.readinessScore, result.readinessBand, result.recommendation) : undefined}
      valueReceipt={result ? [
        { label: "Classification", value: `${result.readinessBand.replace(/_/g, " ")} — ${result.readinessScore}/100` },
        { label: "Escalation path", value: result.recommendedEscalation.replace(/_/g, " ").toLowerCase() },
        { label: "Next admissible move", value: result.recommendation },
        { label: "Memory entry", value: "Saved to governed memory" },
        { label: "Dossier", value: "PDF dossier available" },
      ] : undefined}
    >
      {!result ? (
        <EscalationReadinessRunner onComplete={handleComplete} />
      ) : (
        <div className="space-y-4">
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: result.readinessBand === "OVERDUE" ? "rgba(252,165,165,0.80)" : "#C9A96ECC" }}>
            Readiness: {result.readinessScore}/100 — {result.readinessBand.replace(/_/g, " ")}
          </div>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{result.recommendation}</p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>Result saved. Governed. v{result.version}</p>
        </div>
      )}
    </InstrumentShell>
  );
};

export default EscalationReadinessRun;
