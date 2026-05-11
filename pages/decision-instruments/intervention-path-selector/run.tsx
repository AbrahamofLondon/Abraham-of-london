import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import InterventionPathRunner from "@/components/instruments/InterventionPathRunner";
import { track } from "@/lib/analytics/track";
import type { InterventionResult } from "@/lib/instruments/intervention-path/engine";

const InterventionPathRun: NextPage = () => {
  const [result, setResult] = React.useState<InterventionResult | null>(null);
  const [resultKey, setResultKey] = React.useState<string | null>(null);
  React.useEffect(() => { track("instrument_started", { instrumentSlug: "intervention-path-selector" }); }, []);

  async function handleComplete(r: InterventionResult) {
    setResult(r);
    try {
      const res = await fetch("/api/decision-instruments/results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instrumentSlug: "intervention-path-selector", version: r.version, result: r }) });
      const data = await res.json();
      if (data.journeyKey) setResultKey(data.journeyKey);
    } catch (err) { console.error("[instrument] Result persist failed:", err); }
  }

  const nextDest = result?.recommendedPath === "ESCALATE" ? "/strategy-room" : "/diagnostics/executive-reporting";
  const nextHref = resultKey ? `${nextDest}?instrumentResultId=${encodeURIComponent(resultKey)}` : nextDest;

  return (
    <InstrumentShell title="Intervention Path Selector" slug="intervention-path-selector" completed={!!result} pdfHref="/api/downloads/instrument-pdf?slug=intervention-path-selector" nextStepLabel={result?.recommendedPath === "ESCALATE" ? "Enter governed execution" : "Analyse institutional consequence"} nextStepHref={nextHref}
      valueReceipt={result ? [
        { label: "Recommended path", value: result.recommendedPath.replace(/_/g, " ").toLowerCase() },
        { label: "Escalation window", value: `${result.escalationWindow} days` },
        { label: "Execution status", value: result.executionBlocked ? `Blocked — ${result.blockReason}` : "Unblocked" },
        { label: "Memory entry", value: "Saved to governed memory" },
        { label: "Dossier", value: "PDF dossier available" },
      ] : undefined}
    >
      {!result ? <InterventionPathRunner onComplete={handleComplete} /> : (
        <div className="space-y-4">
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: result.executionBlocked ? "rgba(252,165,165,0.70)" : "#C9A96ECC" }}>
            Path: {result.recommendedPath}
          </div>
          {result.executionBlocked && <p style={{ fontSize: "0.92rem", color: "rgba(252,165,165,0.60)", fontWeight: 500 }}>{result.blockReason}</p>}
          {result.rationale.map((r, i) => <p key={i} style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.50)" }}>{r}</p>)}
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>Escalation window: {result.escalationWindow} days · v{result.version}</p>
        </div>
      )}
    </InstrumentShell>
  );
};
export default InterventionPathRun;
