import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import DecisionExposureRunner from "@/components/instruments/DecisionExposureRunner";
import { track } from "@/lib/analytics/track";
import type { ExposureResult } from "@/lib/instruments/decision-exposure/engine";

const DecisionExposureRun: NextPage = () => {
  const [result, setResult] = React.useState<ExposureResult | null>(null);

  React.useEffect(() => { track("instrument_started", { instrumentSlug: "decision-exposure-instrument" }); }, []);

  async function handleComplete(r: ExposureResult) {
    setResult(r);
    track("instrument_result_saved", { instrumentSlug: "decision-exposure-instrument", scoreBand: r.exposureBand });
    await fetch("/api/decision-instruments/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instrumentSlug: "decision-exposure-instrument", version: r.version, scores: r.dimensionScores, result: r }),
    }).catch((err) => { console.error("[instrument] Result persist failed:", err); });
  }

  return (
    <InstrumentShell
      title="Decision Exposure Instrument"
      slug="decision-exposure-instrument"
      completed={!!result}
      pdfHref="/assets/downloads/decision-exposure-instrument.pdf"
      nextStepLabel="See the cost you are already paying"
      nextStepHref="/diagnostics/executive-reporting"
    >
      {!result ? (
        <DecisionExposureRunner onComplete={handleComplete} />
      ) : (
        <div className="space-y-4">
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: result.exposureBand === "CRITICAL" ? "rgba(252,165,165,0.80)" : "#C9A96ECC" }}>
            Exposure: {result.exposureScore}/100 — {result.exposureBand}
          </div>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{result.recommendation}</p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>Result saved. Deterministic. v{result.version}</p>
        </div>
      )}
    </InstrumentShell>
  );
};

export default DecisionExposureRun;
