import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import StrategicPriorityStackRunner from "@/components/instruments/StrategicPriorityStackRunner";
import { track } from "@/lib/analytics/track";
import type { PriorityStackResult } from "@/lib/instruments/strategic-priority-stack-builder/engine";

const PriorityStackRun: NextPage = () => {
  const [result, setResult] = React.useState<PriorityStackResult | null>(null);
  const [resultKey, setResultKey] = React.useState<string | null>(null);

  React.useEffect(() => { track("instrument_started", { instrumentSlug: "strategic-priority-stack-builder" }); }, []);

  async function handleComplete(r: PriorityStackResult) {
    setResult(r);
    track("instrument_result_saved", { instrumentSlug: "strategic-priority-stack-builder", decisionState: r.resourcePressureBand });
    try {
      const res = await fetch("/api/decision-instruments/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrumentSlug: "strategic-priority-stack-builder", version: r.version, scores: { stack: r.stack.map((s) => ({ label: s.label, score: s.compositeScore })) }, result: r }),
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
      title="Strategic Priority Stack Builder"
      slug="strategic-priority-stack-builder"
      completed={!!result}
      pdfHref="/api/downloads/instrument-pdf?slug=strategic-priority-stack-builder"
      nextStepLabel="Analyse institutional consequence"
      nextStepHref={nextHref}
    >
      {!result ? (
        <StrategicPriorityStackRunner onComplete={handleComplete} />
      ) : (
        <div className="space-y-4">
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: "#C9A96ECC" }}>
            {result.stack.length} priorities ranked
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: result.conflicts.length > 0 ? "rgba(253,186,116,0.60)" : "rgba(110,231,183,0.50)" }}>
            {result.conflicts.length} conflict{result.conflicts.length !== 1 ? "s" : ""} · Resource: {result.resourcePressureBand}
          </p>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{result.recommendation}</p>
          {result.deferredRiskWarning && <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(252,165,165,0.50)" }}>{result.deferredRiskWarning}</p>}
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>Result saved. Governed. v{result.version}</p>
        </div>
      )}
    </InstrumentShell>
  );
};

export default PriorityStackRun;
