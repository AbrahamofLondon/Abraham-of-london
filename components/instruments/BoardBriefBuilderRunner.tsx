/**
 * BoardBriefBuilderRunner — premium board-ready brief builder UI.
 * Mixed inputs: text fields + sliders + objection list.
 */

import * as React from "react";
import { buildBoardBrief, type BoardBriefInput, type BoardBriefResult } from "@/lib/instruments/board-brief-template/engine";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export default function BoardBriefBuilderRunner({ onComplete }: { onComplete: (result: BoardBriefResult) => void }) {
  const [input, setInput] = React.useState<BoardBriefInput>({
    decisionStatement: "",
    strategicContext: "",
    recommendedDecision: "",
    knownObjections: [""],
    financialExposure: 5,
    consequenceExposure: 5,
    evidenceAvailable: 5,
    authorityClarity: 5,
    urgency: 5,
  });

  const canSubmit = input.decisionStatement.trim().length > 5 && input.recommendedDecision.trim().length > 3;
  const result = React.useMemo(() => canSubmit ? buildBoardBrief(input) : null, [input, canSubmit]);

  function addObjection() { setInput((p) => ({ ...p, knownObjections: [...p.knownObjections, ""] })); }
  function updateObjection(i: number, value: string) { setInput((p) => ({ ...p, knownObjections: p.knownObjections.map((o, idx) => idx === i ? value : o) })); }

  const readinessColor = result?.briefReadiness === "BOARD_READY" ? "rgba(110,231,183,0.70)" : result?.briefReadiness === "REVIEW_READY" ? `${GOLD}CC` : result?.briefReadiness === "DRAFT" ? "rgba(253,186,116,0.70)" : "rgba(252,165,165,0.60)";

  const sliders: Array<{ key: keyof Pick<BoardBriefInput, "financialExposure" | "consequenceExposure" | "evidenceAvailable" | "authorityClarity" | "urgency">; label: string; helper: string }> = [
    { key: "financialExposure", label: "Financial Exposure", helper: "How significant is the financial impact of this decision?" },
    { key: "consequenceExposure", label: "Consequence Exposure", helper: "How severe are the consequences if this decision fails?" },
    { key: "evidenceAvailable", label: "Evidence Available", helper: "How strong is the evidence supporting the recommendation?" },
    { key: "authorityClarity", label: "Authority Clarity", helper: "Is it clear who has the authority to approve this decision?" },
    { key: "urgency", label: "Urgency", helper: "How urgently must the board decide?" },
  ];

  return (
    <div className="space-y-6">
      {result && (
        <div className="flex items-baseline justify-between">
          <div>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Board Readiness</span>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3rem", fontWeight: 300, lineHeight: 1, color: readinessColor }}>{result.readinessScore}</div>
          </div>
          <div className="text-right">
            <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: readinessColor }}>{result.briefReadiness.replace(/_/g, " ")}</span>
            <p style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.30)", marginTop: "4px" }}>Posture: {result.decisionPosture.replace(/_/g, " ").toLowerCase()}</p>
          </div>
        </div>
      )}

      {/* Text inputs */}
      <div>
        <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Decision statement</label>
        <textarea value={input.decisionStatement} onChange={(e) => setInput((p) => ({ ...p, decisionStatement: e.target.value }))} placeholder="What decision must the board address?" rows={2} className="mt-2 w-full resize-none border border-white/10 bg-white/5 p-3 text-sm text-white/70 placeholder:text-white/20 focus:border-amber-500/40 focus:outline-none" />
      </div>
      <div>
        <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Strategic context</label>
        <textarea value={input.strategicContext} onChange={(e) => setInput((p) => ({ ...p, strategicContext: e.target.value }))} placeholder="Why does this decision matter strategically?" rows={2} className="mt-2 w-full resize-none border border-white/10 bg-white/5 p-3 text-sm text-white/70 placeholder:text-white/20 focus:border-amber-500/40 focus:outline-none" />
      </div>
      <div>
        <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Recommended decision</label>
        <textarea value={input.recommendedDecision} onChange={(e) => setInput((p) => ({ ...p, recommendedDecision: e.target.value }))} placeholder="What do you recommend the board decides?" rows={2} className="mt-2 w-full resize-none border border-white/10 bg-white/5 p-3 text-sm text-white/70 placeholder:text-white/20 focus:border-amber-500/40 focus:outline-none" />
      </div>

      {/* Known objections */}
      <div>
        <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Known objections</label>
        {input.knownObjections.map((obj, i) => (
          <input key={i} type="text" value={obj} onChange={(e) => updateObjection(i, e.target.value)} placeholder={`Objection ${i + 1}...`} className="mt-2 w-full border border-white/10 bg-white/5 p-2 text-sm text-white/70 placeholder:text-white/20 focus:border-amber-500/40 focus:outline-none" />
        ))}
        {input.knownObjections.length < 5 && (
          <button onClick={addObjection} style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.25)", marginTop: "0.5rem", cursor: "pointer", border: "none", background: "none" }}>+ Add objection</button>
        )}
      </div>

      {/* Sliders */}
      {sliders.map((s) => (
        <div key={s.key}>
          <div className="flex items-baseline justify-between mb-1">
            <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{s.label}</label>
            <span style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.50)" }}>{input[s.key]}/10</span>
          </div>
          <input type="range" min={0} max={10} step={1} value={input[s.key]} onChange={(e) => setInput((p) => ({ ...p, [s.key]: parseInt(e.target.value) }))} className="w-full" style={{ accentColor: GOLD }} />
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.20)", marginTop: "2px" }}>{s.helper}</p>
        </div>
      ))}

      {/* Result sections */}
      {result && (
        <>
          {result.objectionHandling.length > 0 && (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "0.75rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Objection Responses</span>
              {result.objectionHandling.map((oh, i) => (
                <div key={i} className="mt-3">
                  <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>&ldquo;{oh.objection}&rdquo;</p>
                  <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.50)", marginTop: "0.25rem" }}>{oh.response}</p>
                  <p style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.20)", marginTop: "0.15rem" }}>{oh.evidenceBasis}</p>
                </div>
              ))}
            </div>
          )}
          {result.evidenceGaps.length > 0 && (
            <div style={{ border: "1px solid rgba(252,165,165,0.12)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.75rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)" }}>Evidence Gaps</span>
              {result.evidenceGaps.map((g, i) => <p key={i} style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>{g}</p>)}
            </div>
          )}
          <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Executive Summary</span>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>{result.executiveSummary}</p>
            <p style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>{result.boardroomReadinessSignal}</p>
          </div>
          <button type="button" onClick={() => { track("instrument_completed", { instrumentSlug: "board-brief-template", decisionState: result.briefReadiness }); onComplete(result); }} style={{ width: "100%", padding: "14px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>Save board brief</button>
        </>
      )}
      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.15)", textAlign: "center" }}>Board brief readiness is based on your inputs. It is not independently verified analysis.</p>
    </div>
  );
}
