import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import BoardBriefBuilderRunner from "@/components/instruments/BoardBriefBuilderRunner";
import { track } from "@/lib/analytics/track";
import type { BoardBriefResult } from "@/lib/instruments/board-brief-template/engine";

const BoardBriefRun: NextPage = () => {
  const [result, setResult] = React.useState<BoardBriefResult | null>(null);
  const [resultKey, setResultKey] = React.useState<string | null>(null);

  React.useEffect(() => { track("instrument_started", { instrumentSlug: "board-brief-template" }); }, []);

  async function handleComplete(r: BoardBriefResult) {
    setResult(r);
    track("instrument_result_saved", { instrumentSlug: "board-brief-template", decisionState: r.briefReadiness });
    try {
      const res = await fetch("/api/decision-instruments/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrumentSlug: "board-brief-template", version: r.version, scores: { readiness: r.readinessScore, posture: r.decisionPosture }, result: r }),
      });
      const data = await res.json();
      if (data.journeyKey) setResultKey(data.journeyKey);
    } catch (err) { console.error("[instrument] Result persist failed:", err); }
  }

  return (
    <InstrumentShell
      title="Board Brief Builder"
      slug="board-brief-template"
      completed={!!result}
      pdfHref={resultKey ? `/api/pdf/decision-instrument-dossier?slug=board-brief-template&resultKey=${resultKey}` : undefined}
      nextStepLabel="View boardroom archive"
      nextStepHref="/boardroom"
      valueReceipt={result ? [
        { label: "Board readiness", value: `${result.briefReadiness.replace(/_/g, " ")} — ${result.readinessScore}/100` },
        { label: "Decision posture", value: result.decisionPosture.replace(/_/g, " ").toLowerCase() },
        { label: "Boardroom signal", value: result.boardroomReadinessSignal },
        { label: "Memory entry", value: "Saved to governed memory" },
        { label: "Dossier", value: resultKey ? "PDF dossier available" : "Complete to unlock dossier" },
      ] : undefined}
    >
      {!result ? (
        <BoardBriefBuilderRunner onComplete={handleComplete} />
      ) : (
        <div className="space-y-4">
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: result.briefReadiness === "BOARD_READY" ? "rgba(110,231,183,0.70)" : "#C9A96ECC" }}>
            Board Readiness: {result.readinessScore}/100
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: result.briefReadiness === "BOARD_READY" ? "rgba(110,231,183,0.60)" : "rgba(253,186,116,0.60)" }}>
            {result.briefReadiness.replace(/_/g, " ")} · Posture: {result.decisionPosture.replace(/_/g, " ").toLowerCase()}
          </p>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{result.executiveSummary}</p>
          <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)" }}>{result.boardroomReadinessSignal}</p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>Result saved. Governed. v{result.version}</p>
        </div>
      )}
    </InstrumentShell>
  );
};

export default BoardBriefRun;
