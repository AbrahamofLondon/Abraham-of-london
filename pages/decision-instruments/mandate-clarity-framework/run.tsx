import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import MandateClarityRunner from "@/components/instruments/MandateClarityRunner";
import { track } from "@/lib/analytics/track";
import type { MandateResult } from "@/lib/instruments/mandate-clarity/engine";

const MandateClarityRun: NextPage = () => {
  const [result, setResult] = React.useState<MandateResult | null>(null);
  React.useEffect(() => { track("instrument_started", { instrumentSlug: "mandate-clarity-framework" }); }, []);

  async function handleComplete(r: MandateResult) {
    setResult(r);
    await fetch("/api/decision-instruments/results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instrumentSlug: "mandate-clarity-framework", version: r.version, scores: r.blockScores, result: r }) }).catch(() => {});
  }

  return (
    <InstrumentShell title="Mandate Clarity Framework" slug="mandate-clarity-framework" completed={!!result} pdfHref="/assets/downloads/mandate-clarity-framework.pdf" nextStepLabel="Test the organisational structure" nextStepHref="/diagnostics/constitutional-diagnostic">
      {!result ? <MandateClarityRunner onComplete={handleComplete} /> : (
        <div className="space-y-4">
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: result.authorityType === "DIRECT" ? "rgba(110,231,183,0.70)" : "#C9A96ECC" }}>
            Clarity: {result.clarityScore}/100 — {result.authorityType}
          </div>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{result.recommendation}</p>
        </div>
      )}
    </InstrumentShell>
  );
};
export default MandateClarityRun;
