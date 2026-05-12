import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import TeamAlignmentGapMapRunner from "@/components/instruments/TeamAlignmentGapMapRunner";
import { track } from "@/lib/analytics/track";
import type { AlignmentResult } from "@/lib/instruments/team-alignment-gap-map/engine";
import { buildInstrumentSignalAuthority } from "@/lib/product/instrument-signal-authority";

const TeamAlignmentRun: NextPage = () => {
  const [result, setResult] = React.useState<AlignmentResult | null>(null);
  const [resultKey, setResultKey] = React.useState<string | null>(null);

  React.useEffect(() => { track("instrument_started", { instrumentSlug: "team-alignment-gap-map" }); }, []);

  async function handleComplete(r: AlignmentResult) {
    setResult(r);
    track("instrument_result_saved", { instrumentSlug: "team-alignment-gap-map", decisionState: r.alignmentBand });
    try {
      const res = await fetch("/api/decision-instruments/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrumentSlug: "team-alignment-gap-map", version: r.version, scores: { gaps: r.gaps }, result: r }),
      });
      const data = await res.json();
      if (data.journeyKey) setResultKey(data.journeyKey);
    } catch (err) { console.error("[instrument] Result persist failed:", err); }
  }

  const nextHref = resultKey
    ? `/decision-instruments/mandate-clarity-framework?fromAlignment=${encodeURIComponent(resultKey)}`
    : "/decision-instruments/mandate-clarity-framework";

  return (
    <InstrumentShell
      title="Team Alignment Gap Map"
      slug="team-alignment-gap-map"
      completed={!!result}
      pdfHref="/api/downloads/instrument-pdf?slug=team-alignment-gap-map"
      nextStepLabel="Map mandate clarity"
      nextStepHref={nextHref}
      signalAuthority={result ? buildInstrumentSignalAuthority("team-alignment-gap-map", result.overallAlignmentScore, result.alignmentBand, result.recommendation) : undefined}
      valueReceipt={result ? [
        { label: "Classification", value: `${result.alignmentBand} — ${result.overallAlignmentScore}/100` },
        { label: "Divergence signal", value: result.divergenceSignal },
        { label: "Next admissible move", value: result.recommendation },
        { label: "Memory entry", value: "Saved to governed memory" },
        { label: "Dossier", value: "PDF dossier available" },
      ] : undefined}
    >
      {!result ? (
        <TeamAlignmentGapMapRunner onComplete={handleComplete} />
      ) : (
        <div className="space-y-4">
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: result.alignmentBand === "CRITICAL" ? "rgba(252,165,165,0.80)" : "#C9A96ECC" }}>
            Alignment: {result.overallAlignmentScore}/100 — {result.alignmentBand}
          </div>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{result.recommendation}</p>
          <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)" }}>{result.divergenceSignal}</p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>Result saved. Governed. v{result.version}</p>
        </div>
      )}
    </InstrumentShell>
  );
};

export default TeamAlignmentRun;
