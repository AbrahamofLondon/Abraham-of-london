import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import GovernanceDriftDetectorRunner from "@/components/instruments/GovernanceDriftDetectorRunner";
import { track } from "@/lib/analytics/track";
import type { DriftResult } from "@/lib/instruments/governance-drift-detector/engine";

const GovernanceDriftRun: NextPage = () => {
  const [result, setResult] = React.useState<DriftResult | null>(null);
  const [resultKey, setResultKey] = React.useState<string | null>(null);

  React.useEffect(() => { track("instrument_started", { instrumentSlug: "governance-drift-detector" }); }, []);

  async function handleComplete(r: DriftResult) {
    setResult(r);
    track("instrument_result_saved", { instrumentSlug: "governance-drift-detector", decisionState: r.driftBand });
    try {
      const res = await fetch("/api/decision-instruments/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrumentSlug: "governance-drift-detector", version: r.version, scores: r.dimensionScores, result: r }),
      });
      const data = await res.json();
      if (data.journeyKey) setResultKey(data.journeyKey);
    } catch (err) { console.error("[instrument] Result persist failed:", err); }
  }

  return (
    <InstrumentShell
      title="Governance Drift Detector"
      slug="governance-drift-detector"
      completed={!!result}
      pdfHref="/api/downloads/instrument-pdf?slug=governance-drift-detector"
      nextStepLabel={result?.driftBand === "CRITICAL" ? "Review retained oversight" : "View oversight command"}
      nextStepHref={result?.driftBand === "CRITICAL" ? "/engagements/retained-oversight" : "/oversight"}
    >
      {!result ? (
        <GovernanceDriftDetectorRunner onComplete={handleComplete} />
      ) : (
        <div className="space-y-4">
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: result.driftBand === "CRITICAL" ? "rgba(252,165,165,0.80)" : "#C9A96ECC" }}>
            Drift: {result.driftScore}/100 — {result.driftBand}
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>{result.driftPattern.replace(/_/g, " ")}</p>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{result.recommendation}</p>
          <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)" }}>{result.nextReviewRecommendation}</p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>Result saved. Governed. v{result.version}</p>
        </div>
      )}
    </InstrumentShell>
  );
};

export default GovernanceDriftRun;
