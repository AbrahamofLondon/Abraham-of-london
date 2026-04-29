"use client";

/**
 * Strategy Room — Execution Flow
 *
 * Entry Lock → Decision Declaration → Authority Collapse →
 * Consequence Enforcement → Structural Conflict →
 * Point of No Return → Forced Commitment → Decision Execution Record
 *
 * No "stages." Escalation names only.
 * Micro-tension after every input. No friendly confirmations.
 */

import * as React from "react";
import DecisionChallengeCard from "@/components/diagnostics/DecisionChallengeCard";
import type { ChallengeResult } from "@/lib/server/decision/challenge-engine.server";

const GOLD = "#C9A96E";
const DEEP = "rgb(2 2 3)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type ExecutionStage =
  | "entry_lock"
  | "decision"
  | "authority"
  | "consequence"
  | "conflict"
  | "point_of_no_return"
  | "commitment"
  | "record";

export type DecisionExecutionRecord = {
  decision: string;
  authority: string;
  conflictResolution: string;
  consequence: string;
  firstAction: string;
  completedAt: string;
};

type Props = {
  inheritedDecision?: string | null;
  inheritedBlocker?: string | null;
  inheritedConsequence?: string | null;
  onComplete: (record: DecisionExecutionRecord) => void;
};

export default function ExecutionFlow({ inheritedDecision, inheritedBlocker, inheritedConsequence, onComplete }: Props) {
  const [stage, setStage] = React.useState<ExecutionStage>("entry_lock");
  const [decision, setDecision] = React.useState(inheritedDecision ?? "");
  const [authority, setAuthority] = React.useState("");
  const [consequence, setConsequence] = React.useState(inheritedConsequence ?? "");
  const [conflictChoice, setConflictChoice] = React.useState("");
  const [firstAction, setFirstAction] = React.useState("");
  const [challenge, setChallenge] = React.useState<ChallengeResult | null>(null);
  const [challengeLoading, setChallengeLoading] = React.useState(false);
  const [systemConflict, setSystemConflict] = React.useState({ decision: "", competing: "" });
  const [microTension, setMicroTension] = React.useState("");
  const sessionStart = React.useRef(Date.now());

  // ─── Micro-tension: reacts after every input ───────────────────────────────

  function evaluateMicroTension(text: string, context: "decision" | "authority" | "consequence" | "conflict" | "commitment") {
    const t = text.trim();
    if (t.length < 3) { setMicroTension(""); return; }

    if (context === "decision") {
      if (/^(grow|improve|fix|increase|be more|make things|sort out)/i.test(t)) { setMicroTension("This is not yet a decision."); return; }
      if (/want to|hope to|would like|trying to/i.test(t)) { setMicroTension("This avoids commitment."); return; }
      if (t.includes(" and ") && t.includes(" or ")) { setMicroTension("This cannot be executed as written."); return; }
      if (t.length >= 15) { setMicroTension("Accepted."); return; }
    }
    if (context === "authority") {
      if (/^(everyone|the team|shared|we all|committee|leadership|no one|unclear)/i.test(t)) { setMicroTension("This structure guarantees delay."); return; }
      if (t.length >= 3) { setMicroTension("Accepted."); return; }
    }
    if (context === "consequence") {
      if (/^(things will|it will be|problems|nothing|more of the same)/i.test(t)) { setMicroTension("This does not yet carry consequence."); return; }
      if (t.length < 20) { setMicroTension("That is not yet precise."); return; }
      if (t.length >= 20) { setMicroTension("Accepted."); return; }
    }
    if (context === "conflict") {
      if (t.length >= 10) { setMicroTension("Accepted."); return; }
      setMicroTension("That is not yet precise."); return;
    }
    if (context === "commitment") {
      if (/meeting|plan|think about|consider|discuss/i.test(t)) { setMicroTension("That is reversible. Name something that cannot be undone."); return; }
      if (t.length >= 10) { setMicroTension("Accepted."); return; }
    }
    setMicroTension("");
  }

  // ─── Challenge engine calls ────────────────────────────────────────────────

  async function runChallenge(challengeStage: string, answers: Record<string, unknown>): Promise<ChallengeResult | null> {
    setChallengeLoading(true);
    setChallenge(null);
    try {
      const response = await fetch("/api/diagnostics/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentType: "executive", stage: challengeStage, answers }),
      });
      if (!response.ok) return null;
      const json = (await response.json()) as { ok: boolean } & ChallengeResult;
      if (json.ok && json.severity !== "none") { setChallenge(json); return json; }
      return null;
    } catch { return null; }
    finally { setChallengeLoading(false); }
  }

  async function advanceFromDecision() {
    if (decision.trim().length < 15) return;
    const hit = await runChallenge("decision_context", { decisionQuestion: decision, decision });
    if (hit && !hit.canProceed) return;
    if (hit && hit.canProceed) return;
    setMicroTension(""); setStage("authority");
  }

  async function advanceFromAuthority() {
    if (authority.trim().length < 3) return;
    const hit = await runChallenge("authority", { sponsorNameOrSeat: authority, authority });
    if (hit && !hit.canProceed) return;
    if (hit && hit.canProceed) return;
    setMicroTension(""); setStage("consequence");
  }

  async function advanceFromConsequence() {
    if (consequence.trim().length < 20) return;
    const hit = await runChallenge("exposure", { whatHappensIfNothingChanges: consequence, consequence });
    if (hit && !hit.canProceed) return;
    if (hit && hit.canProceed) return;
    setSystemConflict({
      decision: decision.trim(),
      competing: inheritedBlocker || "the structure that currently prevents this decision from executing",
    });
    setMicroTension(""); setStage("conflict");
  }

  function acceptChallenge(nextStage: ExecutionStage) {
    setChallenge(null);
    if (nextStage === "conflict") {
      setSystemConflict({
        decision: decision.trim(),
        competing: inheritedBlocker || "the structure that currently prevents this decision from executing",
      });
    }
    setMicroTension(""); setStage(nextStage);
  }

  function completeExecution() {
    if (firstAction.trim().length < 10) return;
    onComplete({
      decision: decision.trim(),
      authority: authority.trim(),
      conflictResolution: conflictChoice.trim(),
      consequence: consequence.trim(),
      firstAction: firstAction.trim(),
      completedAt: new Date().toISOString(),
    });
    setStage("record");
  }

  // ─── Session presence indicator ────────────────────────────────────────────

  const showPresence = stage !== "entry_lock" && stage !== "record";

  return (
    <div style={{ backgroundColor: DEEP, minHeight: "100vh", position: "relative" }}>

      {/* Session active indicator */}
      {showPresence && (
        <div style={{ position: "fixed", top: "1rem", right: "1.5rem", zIndex: 50, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: `${GOLD}60`, display: "inline-block" }} />
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
            Session active
          </span>
        </div>
      )}

      {/* ═══ ENTRY LOCK ═══ */}
      {stage === "entry_lock" && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.35em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "2rem" }}>
            Strategy Room
          </div>
          <h1 style={{ ...serif, fontSize: "clamp(1.6rem, 4vw, 2.5rem)", lineHeight: 1.15, color: "rgba(255,255,255,0.94)", maxWidth: "20ch" }}>
            This session will force a decision.
          </h1>
          <p style={{ marginTop: "1.5rem", ...serif, fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.40)", maxWidth: "30ch" }}>
            If you are not prepared to act, do not proceed.
          </p>
          <button
            type="button"
            onClick={() => { sessionStart.current = Date.now(); setStage("decision"); }}
            style={{ marginTop: "3rem", padding: "16px 36px", border: `1px solid ${GOLD}55`, backgroundColor: `${GOLD}10`, color: GOLD, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Proceed under execution constraint
          </button>
        </div>
      )}

      {/* ═══ DECISION DECLARATION ═══ */}
      {stage === "decision" && (
        <EscalationScreen label="Decision Declaration" headline="State the decision as it must be made." microcopy="Not the outcome. Not the hope. The decision.">
          <textarea value={decision} onChange={(e) => { setDecision(e.target.value); evaluateMicroTension(e.target.value, "decision"); }} rows={4} placeholder="One decision. One sentence. No escape clause." autoFocus style={inputStyle} />
          <MicroTensionLine text={microTension} />
          {challenge && <div style={{ marginTop: "1rem" }}><DecisionChallengeCard challenge={challenge} onRevise={() => setChallenge(null)} onAccept={() => acceptChallenge("authority")} /></div>}
          {challengeLoading && <Evaluating />}
          <AdvanceButton onClick={advanceFromDecision} disabled={decision.trim().length < 15} />
        </EscalationScreen>
      )}

      {/* ═══ AUTHORITY COLLAPSE ═══ */}
      {stage === "authority" && (
        <EscalationScreen label="Authority Collapse" headline="Who can make this decision binding — regardless of disagreement?" microcopy="One person. Not a committee. Not &ldquo;leadership.&rdquo;">
          <textarea value={authority} onChange={(e) => { setAuthority(e.target.value); evaluateMicroTension(e.target.value, "authority"); }} rows={2} placeholder="Name the person or role with final, non-delegated authority." autoFocus style={inputStyle} />
          <MicroTensionLine text={microTension} />
          {challenge && <div style={{ marginTop: "1rem" }}><DecisionChallengeCard challenge={challenge} onRevise={() => setChallenge(null)} onAccept={() => acceptChallenge("consequence")} /></div>}
          {challengeLoading && <Evaluating />}
          <AdvanceButton onClick={advanceFromAuthority} disabled={authority.trim().length < 3} />
        </EscalationScreen>
      )}

      {/* ═══ CONSEQUENCE ENFORCEMENT ═══ */}
      {stage === "consequence" && (
        <EscalationScreen label="Consequence Enforcement" headline="If this is not resolved in 30–90 days, what breaks?" microcopy="Include time, measurable impact, and irreversible consequence.">
          <textarea value={consequence} onChange={(e) => { setConsequence(e.target.value); evaluateMicroTension(e.target.value, "consequence"); }} rows={4} placeholder="Be specific. What actually breaks — in money, time, or position?" autoFocus style={inputStyle} />
          <MicroTensionLine text={microTension} />
          {challenge && <div style={{ marginTop: "1rem" }}><DecisionChallengeCard challenge={challenge} onRevise={() => setChallenge(null)} onAccept={() => acceptChallenge("conflict")} /></div>}
          {challengeLoading && <Evaluating />}
          <AdvanceButton onClick={advanceFromConsequence} disabled={consequence.trim().length < 20} />
        </EscalationScreen>
      )}

      {/* ═══ STRUCTURAL CONFLICT ═══ */}
      {stage === "conflict" && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div style={{ width: "100%", maxWidth: "640px" }}>
            <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "1.5rem" }}>
              Structural Conflict
            </div>

            <div style={{ border: `1px solid ${GOLD}30`, backgroundColor: `${GOLD}06`, padding: "1.5rem 1.75rem", marginBottom: "2rem" }}>
              <p style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>
                You stated:
              </p>

              <div style={{ marginTop: "1rem" }}>
                <div style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.35rem" }}>Decision</div>
                <p style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.5, color: "rgba(255,255,255,0.88)", paddingLeft: "1rem", borderLeft: `2px solid ${GOLD}40` }}>
                  &ldquo;{systemConflict.decision}&rdquo;
                </p>
              </div>

              <div style={{ marginTop: "1.25rem" }}>
                <div style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)", marginBottom: "0.35rem" }}>Blocker</div>
                <p style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.5, color: "rgba(255,255,255,0.88)", paddingLeft: "1rem", borderLeft: "2px solid rgba(252,165,165,0.30)" }}>
                  &ldquo;{systemConflict.competing}&rdquo;
                </p>
              </div>

              <p style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.55, color: "rgba(255,255,255,0.55)", marginTop: "1.5rem" }}>
                These cannot coexist.
              </p>
            </div>

            <h2 style={{ ...serif, fontSize: "1.4rem", lineHeight: 1.25, color: "rgba(255,255,255,0.90)" }}>
              Which one gives way?
            </h2>
            <textarea value={conflictChoice} onChange={(e) => { setConflictChoice(e.target.value); evaluateMicroTension(e.target.value, "conflict"); }} rows={3} placeholder="State clearly what you are releasing." autoFocus style={{ ...inputStyle, marginTop: "1.25rem" }} />
            <MicroTensionLine text={microTension} />
            <AdvanceButton onClick={() => { if (conflictChoice.trim().length >= 10) { setMicroTension(""); setStage("point_of_no_return"); } }} disabled={conflictChoice.trim().length < 10} />
          </div>
        </div>
      )}

      {/* ═══ POINT OF NO RETURN ═══ */}
      {stage === "point_of_no_return" && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div style={{ maxWidth: "480px" }}>
            <p style={{ ...serif, fontSize: "clamp(1.4rem, 3vw, 2rem)", lineHeight: 1.3, color: "rgba(255,255,255,0.90)" }}>
              Stop.
            </p>
            <p style={{ marginTop: "1.5rem", ...serif, fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>
              You now have enough clarity to act.
            </p>
            <p style={{ marginTop: "0.5rem", ...serif, fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>
              You also have enough clarity to avoid acting.
            </p>
            <p style={{ marginTop: "1.75rem", ...serif, fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(255,255,255,0.38)" }}>
              Most people stop here.
            </p>
            <p style={{ marginTop: "0.5rem", ...serif, fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(255,255,255,0.38)" }}>
              They keep the insight, delay the decision, and call it progress.
            </p>
            <p style={{ marginTop: "0.5rem", ...serif, fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(255,255,255,0.38)" }}>
              That is how this situation continues.
            </p>
            <p style={{ marginTop: "1.75rem", ...serif, fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(255,255,255,0.70)" }}>
              If you proceed, you are choosing to remove that option.
            </p>
            <button
              type="button"
              onClick={() => { setMicroTension(""); setStage("commitment"); }}
              style={{ marginTop: "2.5rem", padding: "16px 36px", border: `1px solid ${GOLD}55`, backgroundColor: `${GOLD}10`, color: GOLD, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Proceed under consequence
            </button>
          </div>
        </div>
      )}

      {/* ═══ FORCED COMMITMENT ═══ */}
      {stage === "commitment" && (
        <EscalationScreen label="Commitment" headline="What is the first irreversible step?" microcopy="Not a plan. Not a meeting. The action that cannot be undone.">
          <textarea value={firstAction} onChange={(e) => { setFirstAction(e.target.value); evaluateMicroTension(e.target.value, "commitment"); }} rows={3} placeholder="Name the action and the deadline." autoFocus style={inputStyle} />
          <MicroTensionLine text={microTension} />
          <button
            type="button"
            onClick={completeExecution}
            disabled={firstAction.trim().length < 10}
            style={{ marginTop: "1.5rem", padding: "16px 36px", border: `1px solid ${firstAction.trim().length >= 10 ? `${GOLD}55` : "rgba(255,255,255,0.08)"}`, backgroundColor: firstAction.trim().length >= 10 ? `${GOLD}12` : "transparent", color: firstAction.trim().length >= 10 ? GOLD : "rgba(255,255,255,0.15)", ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: firstAction.trim().length >= 10 ? "pointer" : "default" }}
          >
            Lock decision
          </button>
        </EscalationScreen>
      )}

      {/* ═══ DECISION EXECUTION RECORD ═══ */}
      {stage === "record" && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div style={{ width: "100%", maxWidth: "640px" }}>
            <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.35em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "2rem" }}>
              Decision Execution Record
            </div>
            <div style={{ ...serif, fontSize: "1.2rem", lineHeight: 1.4, color: "rgba(255,255,255,0.90)", marginBottom: "0.75rem" }}>
              This decision is now executable.
            </div>
            <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.5, color: "rgba(255,255,255,0.40)", marginBottom: "2rem" }}>
              If it does not move, it is no longer a structure problem.
            </p>
            <RecordLine label="Decision (locked)" value={decision} />
            <RecordLine label="Authority (locked)" value={authority} />
            <RecordLine label="Conflict resolved" value={conflictChoice} />
            <RecordLine label="Consequence if unresolved" value={consequence} />
            <RecordLine label="First action" value={firstAction} />
            <RecordLine label="Locked" value={new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Primitives ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "16px",
  border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.40)",
  color: "rgba(255,255,255,0.88)", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300, fontSize: "1rem", lineHeight: 1.65, resize: "none", outline: "none",
};

function EscalationScreen({ label, headline, microcopy, children }: {
  label: string; headline: string; microcopy: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div style={{ width: "100%", maxWidth: "640px" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "1.5rem" }}>
          {label}
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.3rem, 3vw, 1.8rem)", lineHeight: 1.25, color: "rgba(255,255,255,0.92)", maxWidth: "28ch" }}>
          {headline}
        </h2>
        <p style={{ marginTop: "0.6rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.30)" }} dangerouslySetInnerHTML={{ __html: microcopy }} />
        <div style={{ marginTop: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}

function MicroTensionLine({ text }: { text: string }) {
  if (!text) return null;
  const isAccepted = text === "Accepted.";
  return (
    <p style={{
      marginTop: "0.6rem",
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: "8px",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: isAccepted ? "rgba(110,231,183,0.50)" : "rgba(252,165,165,0.60)",
      transition: "opacity 200ms",
    }}>
      {text}
    </p>
  );
}

function AdvanceButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
      <button type="button" onClick={onClick} disabled={disabled}
        style={{ padding: "14px 28px", border: `1px solid ${disabled ? "rgba(255,255,255,0.08)" : "#C9A96E50"}`, backgroundColor: disabled ? "transparent" : "#C9A96E12", color: disabled ? "rgba(255,255,255,0.15)" : "#C9A96ECC", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", cursor: disabled ? "default" : "pointer" }}
      >
        Continue
      </button>
    </div>
  );
}

function Evaluating() {
  return <p style={{ marginTop: "0.75rem", color: "rgba(255,255,255,0.30)", fontSize: "0.85rem" }}>Evaluating...</p>;
}

function RecordLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 0" }}>
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.35rem" }}>
        {label}
      </div>
      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.97rem", lineHeight: 1.6, color: "rgba(255,255,255,0.75)" }}>
        {value}
      </p>
    </div>
  );
}
