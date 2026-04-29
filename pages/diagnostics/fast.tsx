import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";
import { trackHesitation, trackScrollDepth } from "@/lib/analytics/hesitation";
import type { FastDiagnosticResult } from "@/lib/diagnostics/fast-diagnostic-dto";
import ExecutiveDecisionAuthorityBlock from "@/components/diagnostics/results/ExecutiveDecisionAuthorityBlock";

const GOLD = "#C9A96E";
const RED = "rgba(252,165,165,";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type Question =
  | { id: "decision"; question: string; helper: string; type: "textarea"; placeholder: string }
  | { id: "claimedOwner" | "blocker" | "urgency" | "consequence"; question: string; helper: string; type: "options"; options: string[] };

const QUESTIONS: Question[] = [
  {
    id: "decision",
    question: "Where is the decision breaking down?",
    helper: "Most delays are not execution failures. They are structural.",
    type: "textarea",
    placeholder: "Describe the decision that is currently stuck…",
  },
  {
    id: "claimedOwner",
    question: "Who should own this decision?",
    helper: "One owner is stronger than implied ownership.",
    type: "options",
    options: ["You", "Team", "Shared", "Unclear"],
  },
  {
    id: "blocker",
    question: "What is currently blocking it?",
    helper: "Choose the condition that is carrying the most pressure.",
    type: "options",
    options: ["Lack of clarity", "Misalignment", "Risk", "No authority", "Other"],
  },
  {
    id: "urgency",
    question: "How urgent is this?",
    helper: "Urgency affects consequence, not just pace.",
    type: "options",
    options: ["Low", "Medium", "High", "Critical"],
  },
  {
    id: "consequence",
    question: "What happens if nothing changes?",
    helper: "Choose the closest live consequence.",
    type: "options",
    options: [
      "Decision delay compounds and execution stalls",
      "Workarounds replace structure",
      "Risk increases and confidence drops",
      "Authority gets bypassed",
    ],
  },
];

type ViewStage = "questions" | "signal" | "commitment" | "loading" | "recovery" | "result";

const FastDiagnosticPage: NextPage = () => {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [stage, setStage] = React.useState<ViewStage>("questions");
  const [committed, setCommitted] = React.useState(false);
  const [result, setResult] = React.useState<FastDiagnosticResult | null>(null);
  const [error, setError] = React.useState("");
  const startedAt = React.useRef<number>(Date.now());

  React.useEffect(() => {
    track("fast_diagnostic_page_view");
    const cleanScroll = trackScrollDepth("fast_diagnostic", [50, 80]);
    const cleanHesitation = trackHesitation({ page: "fast_diagnostic", idleTimeout: 5000 });
    try {
      const raw = sessionStorage.getItem("aol_fast_result");
      if (!raw) return;
      const stored = JSON.parse(raw) as FastDiagnosticResult;
      if (stored?.caseRef) {
        setResult(stored);
        setStage("result");
      }
    } catch {
      // ignore
    }
    return () => {
      cleanScroll();
      cleanHesitation();
    };
  }, []);

  const currentQuestion = QUESTIONS[currentIndex]!;
  const currentValue = answers[currentQuestion.id] ?? "";
  const canAdvance = currentQuestion.type === "textarea"
    ? currentValue.trim().length >= 12
    : currentValue.trim().length > 0;

  function updateAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  }

  function nextQuestion() {
    if (!canAdvance) return;
    if (currentIndex === 0) {
      setStage("signal");
      return;
    }
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }
    setStage("commitment");
  }

  function previousQuestion() {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
  }

  async function submitFastDiagnostic(commitmentOverride?: boolean) {
    setStage("loading");
    setError("");
    const commitmentValue = commitmentOverride ?? committed;

    try {
      const response = await fetch("/api/diagnostics/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          committed: commitmentValue,
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      const json = (await response.json()) as FastDiagnosticResult | { ok?: false; error?: string };

      if (!response.ok || "caseRef" in json === false) {
        throw new Error("error" in json && json.error ? json.error : "Unable to complete analysis.");
      }

      const publicResult = json as FastDiagnosticResult;
      setResult(publicResult);
      try {
        sessionStorage.setItem("aol_fast_result", JSON.stringify(publicResult));
      } catch {
        // ignore
      }

      track("fast_diagnostic_completed", {
        committed: commitmentValue,
        elapsed_seconds: Math.round((Date.now() - startedAt.current) / 1000),
      });

      if (publicResult.recoveryQuestion) {
        setStage("recovery");
        return;
      }

      setStage("result");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to complete analysis.");
      setStage("questions");
    }
  }

  function resetDiagnostic() {
    setAnswers({});
    setCurrentIndex(0);
    setStage("questions");
    setCommitted(false);
    setResult(null);
    setError("");
    startedAt.current = Date.now();
    try {
      sessionStorage.removeItem("aol_fast_result");
    } catch {
      // ignore
    }
  }

  const initialSignalPreview = (() => {
    const decision = answers.decision?.trim() ?? "";
    if (/approve|sign off|board|ceo|owner|authority|permission/i.test(decision)) {
      return "Initial signal detected: decision ownership appears unstable.";
    }
    if (/delay|stuck|waiting|blocked|unclear/i.test(decision)) {
      return "Initial signal detected: the structural constraint is likely sitting above execution.";
    }
    return "Initial signal detected: decision ownership appears unstable.";
  })();

  const boardView = result?.authorityIndex?.boardMeaning
    ?? "From a board perspective: this signals a breakdown in decision governance, not a temporary execution issue.";

  const requiredMove = result?.synthesis?.concreteMove
    ?? "Assign a single accountable decision owner. Remove shared authority from the decision path. Set a clear execution window.";

  const recommendedNextStep = result?.executionFailure?.requiredCorrection
    ?? result?.synthesis?.whyPriorAttemptsFailed
    ?? "Confirm the owner, the boundary, and the consequence before widening the response.";

  return (
    <Layout title="Decision Check" description="A governed fast diagnostic for live decision exposure.">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="min-h-screen px-6 py-16" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-3xl">
          <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}05`, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}80` }}>
              Fast Diagnostic
            </div>
            <h1 style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "2rem", lineHeight: 1.2, color: "rgba(255,255,255,0.92)", marginTop: "0.5rem" }}>
              Where is the decision breaking down?
            </h1>
            <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "0.5rem" }}>
              Most delays are not execution failures. They are structural.
            </p>
          </div>

          {stage === "questions" && (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem" }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                Step {currentIndex + 1} of {QUESTIONS.length}
              </div>
              <h2 style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.25rem", lineHeight: 1.5, color: "rgba(255,255,255,0.88)", marginTop: "0.75rem" }}>
                {currentQuestion.question}
              </h2>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.42)", marginTop: "0.35rem" }}>
                {currentQuestion.helper}
              </p>
              {currentQuestion.type === "textarea" ? (
                <textarea
                  value={currentValue}
                  onChange={(e) => updateAnswer(e.target.value)}
                  rows={4}
                  placeholder={currentQuestion.placeholder}
                  style={{ width: "100%", marginTop: "1rem", padding: "14px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.28)", color: "rgba(255,255,255,0.85)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.6, resize: "vertical", outline: "none" }}
                />
              ) : (
                <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
                  {currentQuestion.options.map((option) => {
                    const selected = currentValue === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateAnswer(option)}
                        style={{
                          padding: "14px 16px",
                          textAlign: "left",
                          border: `1px solid ${selected ? `${GOLD}44` : "rgba(255,255,255,0.08)"}`,
                          backgroundColor: selected ? `${GOLD}10` : "rgba(255,255,255,0.01)",
                          color: selected ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.62)",
                          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                          fontSize: "0.95rem",
                          lineHeight: 1.5,
                          cursor: "pointer",
                        }}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}
              {error ? (
                <p style={{ marginTop: "0.75rem", color: "rgba(252,165,165,0.82)", fontSize: "0.88rem" }}>{error}</p>
              ) : null}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={previousQuestion}
                  disabled={currentIndex === 0}
                  style={{ padding: "12px 18px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "transparent", color: currentIndex === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.60)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: currentIndex === 0 ? "default" : "pointer" }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={nextQuestion}
                  disabled={!canAdvance}
                  style={{ padding: "12px 18px", border: `1px solid ${canAdvance ? `${GOLD}50` : "rgba(255,255,255,0.10)"}`, backgroundColor: canAdvance ? `${GOLD}12` : "transparent", color: canAdvance ? `${GOLD}CC` : "rgba(255,255,255,0.18)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: canAdvance ? "pointer" : "default" }}
                >
                  {currentIndex === 0 ? "Continue" : currentIndex === QUESTIONS.length - 1 ? "Continue" : "Next"}
                </button>
              </div>
            </div>
          )}

          {stage === "signal" && (
            <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}05`, padding: "1.5rem" }}>
              <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80` }}>Initial signal</div>
              <p style={{ ...serif, fontSize: "1.15rem", lineHeight: 1.5, color: "rgba(255,255,255,0.82)", marginTop: "0.6rem" }}>
                Decision ownership appears unstable.
              </p>
              <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "0.5rem" }}>
                {initialSignalPreview}
              </p>
              <button
                type="button"
                onClick={() => { setCurrentIndex(1); setStage("questions"); }}
                style={{ marginTop: "1rem", padding: "12px 20px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
              >
                Continue analysis
              </button>
            </div>
          )}

          {stage === "commitment" && (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem", textAlign: "center" }}>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.78)" }}>
                If the analysis identifies the root constraint clearly, are you prepared to act on it within 48 hours?
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => { setCommitted(true); void submitFastDiagnostic(true); }}
                  style={{ padding: "12px 20px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Yes — Continue
                </button>
                <Link
                  href="/"
                  style={{ padding: "12px 20px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "transparent", color: "rgba(255,255,255,0.60)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}
                >
                  No — Exit
                </Link>
              </div>
            </div>
          )}

          {stage === "loading" && (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.70)" }}>
              Preparing governed analysis...
            </div>
          )}

          {stage === "recovery" && result && (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem" }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}80` }}>
                More detail required
              </div>
              <p style={{ marginTop: "0.6rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.74)" }}>
                {result.recoveryQuestion}
              </p>
              <button
                type="button"
                onClick={resetDiagnostic}
                style={{ marginTop: "1rem", padding: "12px 18px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
              >
                Restart with more detail
              </button>
            </div>
          )}

          {stage === "result" && result && (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}05`, padding: "1.25rem" }}>
                <div style={{ marginTop: "0.45rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.25rem", lineHeight: 1.4, color: "rgba(255,255,255,0.92)" }}>
                  This is not an execution problem.
                </div>
                <div style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.25rem", lineHeight: 1.4, color: "rgba(255,255,255,0.92)", marginTop: "0.15rem" }}>
                  It is a decision structure failure.
                </div>
                <div style={{ marginTop: "0.6rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.9rem", lineHeight: 1.6, color: `${GOLD}CC` }}>
                  Current condition: {result.condition === "authority"
                    ? "Decision authority is fragmented."
                    : result.condition === "definition"
                      ? "The decision itself is not clearly defined."
                      : result.condition === "execution"
                        ? "The next move is known, but ownership is not carrying it."
                        : "The decision is unstable under pressure."}
                </div>
              </div>

              {result.synthesis ? (
                <>
                  <Section title="Core diagnosis" body={result.synthesis.primaryContradiction || result.synthesis.verdict} />
                  <Section title="Why it exists" body={result.synthesis.whyPriorAttemptsFailed} />
                </>
              ) : null}

              {result.patternEvidence ? (
                <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem 1.25rem" }}>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}80` }}>
                    Pattern recognition
                  </div>
                  <p style={{ marginTop: "0.45rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>
                    {result.patternEvidence.recognitionLine}
                  </p>
                  <div style={{ marginTop: "0.8rem", ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
                    From observed similar cases
                  </div>
                  <div style={{ marginTop: "0.45rem", display: "grid", gap: "0.45rem" }}>
                    {result.patternEvidence.observations.map((line) => (
                      <p key={line} style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.58)" }}>
                        • {line}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              {result.costOfInaction ? (
                <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem 1.25rem" }}>
                  <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}80` }}>
                    Cost of inaction
                  </div>
                  <div style={{ marginTop: "0.45rem", display: "grid", gap: "0.55rem" }}>
                    <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.68, color: "rgba(255,255,255,0.72)" }}>
                      30 days: {result.costOfInaction.horizon30}
                    </p>
                    <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.68, color: "rgba(255,255,255,0.72)" }}>
                      60 days: {result.costOfInaction.horizon60}
                    </p>
                    <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.68, color: "rgba(255,255,255,0.72)" }}>
                      90 days: {result.costOfInaction.horizon90}
                    </p>
                  </div>
                </div>
              ) : null}

              <Section title="Board-level view" body={boardView} />
              <Section title="Required move" body={requiredMove} />
              <Section title="Recommended next step" body={recommendedNextStep} />

              {/* Executive Decision Authority Block */}
              <ExecutiveDecisionAuthorityBlock authorityIndex={result.authorityIndex} costOfInaction={result.costOfInaction} executionFailure={result.executionFailure} />

              <Section
                title="Escalation status"
                body={result.forecast?.controlShiftSummary ?? "Governed analysis complete."}
              />

              <div style={{ border: `1px solid ${RED}0.15)`, backgroundColor: `${RED}0.03)`, padding: "1rem 1.25rem" }}>
                <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${RED}0.45)` }}>Impact</div>
                <p style={{ marginTop: "0.4rem", ...serif, fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>
                  If this is not corrected, the cost will not remain operational. It will become structural.
                </p>
              </div>

              {result.arbiterMessage ? (
                <Section title="System integrity note" body={result.arbiterMessage} />
              ) : null}

              <div className="flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Governed analysis · {result.signalStrength} reading strength</span>
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link href="/diagnostics/executive-reporting" style={{ padding: "12px 18px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
                  Run full executive analysis <ArrowRight style={{ width: 10, height: 10, display: "inline", marginLeft: 4 }} />
                </Link>
                <button type="button" onClick={resetDiagnostic} style={{ padding: "12px 18px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "transparent", color: "rgba(255,255,255,0.50)", ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}>
                  Start again
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem 1.25rem" }}>
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
        {title}
      </div>
      <p style={{ marginTop: "0.45rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>
        {body}
      </p>
    </div>
  );
}

export default FastDiagnosticPage;
