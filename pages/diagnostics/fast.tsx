/**
 * Fast Diagnostic — Operational Decision Intelligence.
 *
 * 6 free-text questions about the user's SPECIFIC situation.
 * Synthesis engine produces bespoke output from their words.
 * Precision recovery if input is too vague.
 *
 * Test: "Could this output have existed before this user arrived?"
 * If yes → fail. If no → ship.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";
import { createCaseObject, type CaseObject } from "@/lib/decision/case-object";
import { scoreC3 } from "@/lib/decision/c3-fidelity-scorer";
import { synthesise, type GovernedSynthesis } from "@/lib/decision/synthesis-engine";
import { forecastDefaultPath } from "@/lib/decision/default-path-forecast";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type Stage = "entry" | "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "synthesising" | "recovery" | "result";

const QUESTIONS: Array<{ id: string; question: string; placeholder: string }> = [
  { id: "decision", question: "What decision are you currently unable to resolve?", placeholder: "Not the topic — the decision. One sentence if possible." },
  { id: "priorAttempt", question: "What has already been tried, and what specifically went wrong?", placeholder: "If nothing has been tried, say so. If something failed, state what and why." },
  { id: "costOfDelay", question: "What becomes more expensive each week this remains unresolved?", placeholder: "Name the specific cost — financial, structural, political, reputational." },
  { id: "claimedOwner", question: "Who is supposed to own this decision — and do they know it?", placeholder: "Name the person or role. If no one owns it, say that." },
  { id: "blocker", question: "What is the single thing preventing this from being decided?", placeholder: "Not symptoms. The thing preventing the decision from being made right now." },
  { id: "forcedAction", question: "If you were forced to decide in the next 24 hours, what would you actually do?", placeholder: "Be honest. Not what you should do — what you would do." },
];

const FastDiagnosticPage: NextPage = () => {
  const [stage, setStage] = React.useState<Stage>("entry");
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = React.useState(0);
  const [synthesis, setSynthesis] = React.useState<GovernedSynthesis | null>(null);
  const [synthesisSource, setSynthesisSource] = React.useState<"llm" | "deterministic" | "recovery">("deterministic");
  const [recoveryQuestion, setRecoveryQuestion] = React.useState<string | null>(null);
  const startTime = React.useRef(0);

  React.useEffect(() => { track("fast_diagnostic_page_view"); }, []);

  function startDiagnostic() {
    startTime.current = Date.now();
    track("fast_diagnostic_started");
    setStage("q1");
  }

  function handleAnswer(value: string) {
    const q = QUESTIONS[currentQ]!;
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  }

  async function advance() {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((q) => q + 1);
      setStage(`q${currentQ + 2}` as Stage);
    } else {
      // All questions answered — synthesise
      setStage("synthesising");
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      track("fast_diagnostic_completed", { elapsed_seconds: elapsed });

      const caseObj = createCaseObject({
        id: `fast_${Date.now()}`,
        decision: answers.decision ?? "",
        priorAttempt: answers.priorAttempt,
        costOfDelay: answers.costOfDelay,
        claimedOwner: answers.claimedOwner,
        blocker: answers.blocker,
        forcedAction: answers.forcedAction,
      });

      // Attempt synthesis via API
      try {
        const res = await fetch("/api/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage: "fast_diagnostic",
            canonicalResult: caseObj,
            userInputs: answers,
            synthesisMode: true,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.synthesis) {
            const result = await synthesise(caseObj, async () => JSON.stringify(data.synthesis));
            setSynthesis(result.synthesis);
            setSynthesisSource(result.source);
            if (result.source === "recovery" && result.recoveryQuestion) {
              setRecoveryQuestion(result.recoveryQuestion);
              setStage("recovery");
              return;
            }
            setStage("result");
            return;
          }
        }
      } catch {
        // API failed — fall through to local synthesis
      }

      // Local synthesis (deterministic fallback)
      const result = await synthesise(caseObj);
      setSynthesis(result.synthesis);
      setSynthesisSource(result.source);
      if (result.source === "recovery" && result.recoveryQuestion) {
        setRecoveryQuestion(result.recoveryQuestion);
        setStage("recovery");
        return;
      }
      setStage("result");
    }
  }

  const currentAnswer = answers[QUESTIONS[currentQ]?.id ?? ""] ?? "";
  const canAdvance = currentAnswer.trim().length >= 10;

  // ─── ENTRY ───
  if (stage === "entry") {
    return (
      <Layout title="Decision Check" description="Operational decision intelligence. 3 minutes.">
        <Head><meta name="robots" content="noindex" /></Head>
        <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <div className="max-w-lg text-center">
            <h1 style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 400, color: "rgba(255,255,255,0.88)", lineHeight: 1.3 }}>
              When the decision cannot wait.
            </h1>
            <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.75, color: "rgba(255,255,255,0.40)", marginTop: "1.25rem", maxWidth: "42ch", marginLeft: "auto", marginRight: "auto" }}>
              6 questions about your specific decision. The system will identify the contradiction you haven&apos;t named and the move you haven&apos;t made.
            </p>
            <button type="button" onClick={startDiagnostic} style={{ marginTop: "2rem", padding: "14px 28px", border: `1px solid ${GOLD}60`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
              Start decision check <ArrowRight style={{ width: 11, height: 11, display: "inline", marginLeft: "0.5rem", verticalAlign: "middle" }} />
            </button>
            <p style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.12)", marginTop: "1.5rem" }}>
              All free text. About your situation. No multiple choice.
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  // ─── SYNTHESISING ───
  if (stage === "synthesising") {
    return (
      <Shell progress={6} hideProgress>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 style={{ width: 24, height: 24, color: `${GOLD}80`, animation: "spin 1.5s linear infinite" }} />
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60`, marginTop: "1rem" }}>
            Synthesising from your case material...
          </p>
        </div>
      </Shell>
    );
  }

  // ─── PRECISION RECOVERY ───
  if (stage === "recovery" && recoveryQuestion) {
    return (
      <Shell progress={6} hideProgress>
        <div style={{ border: `1px solid ${GOLD}25`, backgroundColor: `${GOLD}04`, padding: "1.5rem" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}70` }}>
            Precision blocked
          </span>
          <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.70)", marginTop: "0.75rem", maxWidth: "48ch" }}>
            {recoveryQuestion}
          </p>
          <textarea
            value={currentAnswer}
            onChange={(e) => setAnswers((prev) => ({ ...prev, recovery: e.target.value }))}
            placeholder="Be specific."
            rows={3}
            style={{ width: "100%", marginTop: "1rem", padding: "12px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.80)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.6, resize: "none", outline: "none" }}
          />
          <button type="button" onClick={() => setStage("result")} style={{ marginTop: "1rem", padding: "10px 20px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
            Continue with current input
          </button>
        </div>
      </Shell>
    );
  }

  // ─── QUESTIONS (Q1-Q6) ───
  if (stage.startsWith("q") && stage !== "q6" || stage === "q6") {
    const q = QUESTIONS[currentQ]!;
    return (
      <Shell progress={currentQ + 1}>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.80)" }}>
          {q.question}
        </p>
        <textarea
          value={currentAnswer}
          onChange={(e) => handleAnswer(e.target.value)}
          placeholder={q.placeholder}
          rows={4}
          style={{ width: "100%", marginTop: "1.25rem", padding: "14px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.80)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.6, resize: "none", outline: "none" }}
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && canAdvance) { e.preventDefault(); advance(); } }}
        />
        <div className="flex items-center justify-between mt-3">
          <span style={{ ...mono, fontSize: "7px", color: canAdvance ? "rgba(110,231,183,0.40)" : "rgba(255,255,255,0.12)" }}>
            {canAdvance ? "Ready" : "More detail needed"}
          </span>
          <button type="button" onClick={advance} disabled={!canAdvance} style={{ padding: "10px 20px", border: `1px solid ${canAdvance ? `${GOLD}60` : "rgba(255,255,255,0.06)"}`, backgroundColor: canAdvance ? `${GOLD}10` : "transparent", color: canAdvance ? `${GOLD}CC` : "rgba(255,255,255,0.15)", ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: canAdvance ? "pointer" : "default" }}>
            {currentQ === QUESTIONS.length - 1 ? "Analyse" : "Next"}
          </button>
        </div>
      </Shell>
    );
  }

  // ─── RESULT ───
  if (stage === "result" && synthesis) {
    const elapsed = startTime.current ? Math.round((Date.now() - startTime.current) / 1000) : 0;
    const forecast = forecastDefaultPath(createCaseObject({ id: "temp", decision: answers.decision ?? "", priorAttempt: answers.priorAttempt, costOfDelay: answers.costOfDelay, claimedOwner: answers.claimedOwner, blocker: answers.blocker, forcedAction: answers.forcedAction }));

    return (
      <Layout title="Decision Check — Result" description="Your decision, analysed.">
        <Head><meta name="robots" content="noindex" /></Head>
        <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <div className="mx-auto max-w-xl">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              Decision check · {elapsed}s · {synthesisSource}
            </span>

            {/* 1. VERDICT */}
            <div style={{ marginTop: "1.5rem" }}>
              <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}70` }}>Verdict</span>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.15rem", lineHeight: 1.6, color: "rgba(255,255,255,0.88)", marginTop: "0.35rem", maxWidth: "48ch" }}>
                {synthesis.verdict}
              </p>
            </div>

            {/* 2. THE CONTRADICTION */}
            <div style={{ border: "1px solid rgba(252,165,165,0.18)", backgroundColor: "rgba(252,165,165,0.04)", padding: "1rem", marginTop: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)" }}>The contradiction</span>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", marginTop: "0.2rem", maxWidth: "48ch" }}>
                {synthesis.primaryContradiction}
              </p>
            </div>

            {/* 3. WHAT YOU'RE AVOIDING */}
            <div style={{ border: "1px solid rgba(253,186,116,0.15)", backgroundColor: "rgba(253,186,116,0.03)", padding: "1rem", marginTop: "1rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.50)" }}>What is being avoided</span>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.2rem", maxWidth: "48ch" }}>
                {synthesis.avoidedDecision}
              </p>
            </div>

            {/* 4. WHY PRIOR ATTEMPTS FAILED */}
            {synthesis.whyPriorAttemptsFailed && (
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem", marginTop: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Why prior attempts failed</span>
                <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "0.2rem", maxWidth: "48ch" }}>
                  {synthesis.whyPriorAttemptsFailed}
                </p>
              </div>
            )}

            {/* 5. THE MOVE */}
            <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem", marginTop: "1rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>Your move — within 72 hours</span>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.78)", marginTop: "0.2rem", maxWidth: "48ch" }}>
                {synthesis.concreteMove}
              </p>
            </div>

            {/* 6. DEFAULT PATH — IF IGNORED */}
            <div style={{ border: "1px solid rgba(252,165,165,0.12)", padding: "1rem", marginTop: "1rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.40)" }}>If ignored</span>
              <div className="mt-2 space-y-2">
                {[
                  { label: "7 days", text: forecast.sevenDays },
                  { label: "30 days", text: forecast.thirtyDays },
                  { label: "90 days", text: forecast.ninetyDays },
                ].map((c) => (
                  <div key={c.label} className="flex gap-3">
                    <span style={{ ...mono, fontSize: "7px", color: "rgba(252,165,165,0.30)", minWidth: "50px" }}>{c.label}</span>
                    <span style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.50)" }}>{c.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. CERTAINTY BOUNDARY */}
            <p style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.15)", marginTop: "1rem" }}>
              {synthesis.certaintyBoundary}
            </p>

            {/* 8. SIGNAL STRENGTH */}
            <div className="flex items-center gap-2 mt-2">
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: synthesis.signalStrength === "high" ? "rgba(110,231,183,0.60)" : synthesis.signalStrength === "medium" ? `${GOLD}BB` : "rgba(255,255,255,0.30)" }} />
              <span style={{ ...mono, fontSize: "7px", color: synthesis.signalStrength === "high" ? "rgba(110,231,183,0.50)" : synthesis.signalStrength === "medium" ? `${GOLD}80` : "rgba(255,255,255,0.25)" }}>
                Signal: {synthesis.signalStrength}
              </span>
            </div>

            {/* 9. ESCALATION */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem", marginTop: "1.5rem" }}>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.40)", maxWidth: "48ch" }}>
                Escalate when this must be priced, defended, or enforced.
              </p>
              <Link href="/diagnostics/executive-reporting" className="inline-flex items-center gap-2 mt-4" style={{ padding: "12px 24px", border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
                Escalate decision <ArrowRight style={{ width: 10, height: 10 }} />
              </Link>
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  return null;
};

// ─── SHELL ───
function Shell({ children, progress, hideProgress }: { children: React.ReactNode; progress: number; hideProgress?: boolean }) {
  const GOLD = "#C9A96E";
  return (
    <Layout title="Decision Check" description="Operational decision intelligence.">
      <Head><meta name="robots" content="noindex" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-xl">
          {!hideProgress && (
            <>
              <div className="flex items-center justify-between mb-4">
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase" as const, color: `${GOLD}70` }}>Decision check</span>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", color: "rgba(255,255,255,0.25)" }}>{progress} / 6</span>
              </div>
              <div className="flex gap-1 mb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ flex: 1, height: "2px", backgroundColor: i <= progress ? `${GOLD}80` : "rgba(255,255,255,0.06)" }} />
                ))}
              </div>
            </>
          )}
          {children}
        </div>
      </main>
    </Layout>
  );
}

export default FastDiagnosticPage;
