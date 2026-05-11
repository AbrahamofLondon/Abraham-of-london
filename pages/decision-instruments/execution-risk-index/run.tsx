import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import ExecutionRiskIndexRunner from "@/components/instruments/ExecutionRiskIndexRunner";
import { track } from "@/lib/analytics/track";
import type { ExecutionRiskResult } from "@/lib/instruments/execution-risk-index/engine";

const ExecutionRiskRun: NextPage = () => {
  const [result, setResult] = React.useState<ExecutionRiskResult | null>(null);
  const [resultKey, setResultKey] = React.useState<string | null>(null);

  React.useEffect(() => { track("instrument_started", { instrumentSlug: "execution-risk-index" }); }, []);

  async function handleComplete(r: ExecutionRiskResult) {
    setResult(r);
    track("instrument_result_saved", { instrumentSlug: "execution-risk-index", decisionState: r.riskBand });
    try {
      const res = await fetch("/api/decision-instruments/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrumentSlug: "execution-risk-index", version: r.version, scores: r.dimensionScores, result: r }),
      });
      const data = await res.json();
      if (data.journeyKey) setResultKey(data.journeyKey);
    } catch (err) { console.error("[instrument] Result persist failed:", err); }
  }

  const nextHref = resultKey
    ? `/diagnostics/executive-reporting?instrumentResultId=${encodeURIComponent(resultKey)}`
    : "/strategy-room";

  return (
    <InstrumentShell
      title="Execution Risk Index"
      slug="execution-risk-index"
      completed={!!result}
      pdfHref="/api/downloads/instrument-pdf?slug=execution-risk-index"
      nextStepLabel={result?.riskBand === "CRITICAL" ? "Enter Strategy Room" : "Analyse institutional consequence"}
      nextStepHref={result?.riskBand === "CRITICAL" ? "/strategy-room" : nextHref}
      valueReceipt={result ? [
        { label: "Classification", value: `${result.riskBand} — ${result.riskIndex}/100` },
        { label: "Decay projection", value: result.decayProjection },
        { label: "Next admissible move", value: result.recommendation },
        { label: "Memory entry", value: "Saved to governed memory" },
        { label: "Dossier", value: "PDF dossier available" },
      ] : undefined}
    >
      {!result ? (
        <ExecutionRiskIndexRunner onComplete={handleComplete} />
      ) : (
        <div className="space-y-4">
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: result.riskBand === "CRITICAL" ? "rgba(252,165,165,0.80)" : "#C9A96ECC" }}>
            Risk Index: {result.riskIndex}/100 — {result.riskBand}
          </div>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{result.recommendation}</p>
          <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)" }}>{result.decayProjection}</p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>Result saved. Governed. v{result.version}</p>
        </div>
      )}
    </InstrumentShell>
  );
};

export default ExecutionRiskRun;
