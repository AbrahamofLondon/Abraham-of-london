import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import StructuralFailureCanvasRunner from "@/components/instruments/StructuralFailureCanvasRunner";
import { track } from "@/lib/analytics/track";
import type { FailureResult } from "@/lib/instruments/structural-failure-diagnostic-canvas/engine";

const StructuralFailureRun: NextPage = () => {
  const [result, setResult] = React.useState<FailureResult | null>(null);
  const [resultKey, setResultKey] = React.useState<string | null>(null);

  React.useEffect(() => { track("instrument_started", { instrumentSlug: "structural-failure-diagnostic-canvas" }); }, []);

  async function handleComplete(r: FailureResult) {
    setResult(r);
    track("instrument_result_saved", { instrumentSlug: "structural-failure-diagnostic-canvas", decisionState: r.failurePattern });
    try {
      const res = await fetch("/api/decision-instruments/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrumentSlug: "structural-failure-diagnostic-canvas", version: r.version, scores: r.dimensionScores, result: r }),
      });
      const data = await res.json();
      if (data.journeyKey) setResultKey(data.journeyKey);
    } catch (err) { console.error("[instrument] Result persist failed:", err); }
  }

  const nextHref = resultKey
    ? `/diagnostics/executive-reporting?instrumentResultId=${encodeURIComponent(resultKey)}`
    : "/decision-instruments/intervention-path-selector";

  return (
    <InstrumentShell
      title="Structural Failure Diagnostic Canvas"
      slug="structural-failure-diagnostic-canvas"
      completed={!!result}
      pdfHref="/api/downloads/instrument-pdf?slug=structural-failure-diagnostic-canvas"
      nextStepLabel="Select intervention path"
      nextStepHref={nextHref}
      valueReceipt={result ? [
        { label: "Structural health", value: `${result.healthScore}/100` },
        { label: "Failure pattern", value: result.failurePattern.replace(/_/g, " ").toLowerCase() },
        { label: "Next admissible move", value: result.recommendation },
        { label: "Memory entry", value: "Saved to governed memory" },
        { label: "Dossier", value: "PDF dossier available" },
      ] : undefined}
    >
      {!result ? (
        <StructuralFailureCanvasRunner onComplete={handleComplete} />
      ) : (
        <div className="space-y-4">
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: result.healthScore < 45 ? "rgba(252,165,165,0.80)" : "#C9A96ECC" }}>
            Structural Health: {result.healthScore}/100
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: result.healthScore < 30 ? "rgba(252,165,165,0.60)" : "rgba(201,169,110,0.60)" }}>
            {result.failurePattern.replace(/_/g, " ")}
          </p>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{result.recommendation}</p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>Result saved. Governed. v{result.version}</p>
        </div>
      )}
    </InstrumentShell>
  );
};

export default StructuralFailureRun;
