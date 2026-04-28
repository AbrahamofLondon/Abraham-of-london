import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";
import type { FastDiagnosticResult } from "@/lib/diagnostics/fast-diagnostic-dto";
import ExecutiveDecisionAuthorityBlock from "@/components/diagnostics/results/ExecutiveDecisionAuthorityBlock";

const GOLD = "#C9A96E";
const RED = "rgba(252,165,165,";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const QUESTIONS: Array<{ id: string; question: string; helper: string }> = [
  { id: "decision", question: "What decision are you unable to make right now?", helper: "Name the decision directly." },
  { id: "claimedOwner", question: "Who owns the decision to resolve this?", helper: "Clearly defined owner / Shared across multiple people / Unclear / No one explicitly owns it" },
  { id: "priorAttempt", question: "What have you already tried?", helper: "Briefly describe the previous move." },
  { id: "costOfDelay", question: "What becomes more expensive if this stays unresolved?", helper: "Name the cost in practical terms." },
  { id: "blocker", question: "What is the live blocker?", helper: "Describe the actual point of delay." },
  { id: "forcedAction", question: "If you had to move within 24 hours, what would you do?", helper: "State the move plainly." },
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
  }, []);

  const currentQuestion = QUESTIONS[currentIndex]!;
  const currentValue = answers[currentQuestion.id] ?? "";
  const canAdvance = currentValue.trim().length >= 8;

  function updateAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  }

  function nextQuestion() {
    if (!canAdvance) return;
    // After Q2 (claimedOwner), show signal screen instead of Q3
    if (currentIndex === 1) {
      setStage("signal");
      return;
    }
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }
    // After last question, submit to API
    void submitFastDiagnostic();
  }

  function previousQuestion() {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
  }

  async function submitFastDiagnostic() {
    setStage("loading");
    setError("");

    try {
      const response = await fetch("/api/diagnostics/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, committed }),
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
        committed,
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
              Governed analysis for one live decision
            </h1>
            <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "0.5rem" }}>
              The public surface shows only the reading, the directive, and the next move.
            </p>
          </div>

          {stage === "questions" && (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem" }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                Question {currentIndex + 1} of {QUESTIONS.length}
              </div>
              <h2 style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.25rem", lineHeight: 1.5, color: "rgba(255,255,255,0.88)", marginTop: "0.75rem" }}>
                {currentQuestion.question}
              </h2>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.42)", marginTop: "0.35rem" }}>
                {currentQuestion.helper}
              </p>
              <textarea
                value={currentValue}
                onChange={(e) => updateAnswer(e.target.value)}
                rows={4}
                style={{ width: "100%", marginTop: "1rem", padding: "14px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.28)", color: "rgba(255,255,255,0.85)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.6, resize: "vertical", outline: "none" }}
              />
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
                  {currentIndex === QUESTIONS.length - 1 ? "Run Analysis" : "Next"}
                </button>
              </div>
            </div>
          )}

          {stage === "signal" && (() => {
            const ownership = answers.claimedOwner ?? "";
            const isGap = ownership.includes("Unclear") || ownership.includes("No one") || ownership.includes("not sure") || ownership.length < 5;
            const isDelegated = ownership.includes("someone") || ownership.includes("Someone");
            const signalLabel = isGap ? "Authority gap detected" : isDelegated ? "Delegation dependency" : "Ownership claimed";
            const signalBody = isGap
              ? "The decision you described has no clear owner. Until ownership is named, the condition will compound regardless of effort applied."
              : isDelegated
              ? "You have identified the decision but cannot make it yourself. The system will test whether the stated owner has genuine authority or is absorbing the role without mandate."
              : "You claim authority over this decision. The system will test whether that authority is real — or whether something structural is preventing you from exercising it.";
            return (
              <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}05`, padding: "1.5rem" }}>
                <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80` }}>Initial signal</div>
                <p style={{ ...serif, fontSize: "1.15rem", lineHeight: 1.5, color: "rgba(255,255,255,0.82)", marginTop: "0.6rem" }}>{signalLabel}</p>
                <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "0.5rem" }}>{signalBody}</p>
                <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.20)", marginTop: "0.75rem" }}>The remaining questions will expose whether this condition is structural.</p>
                <button type="button" onClick={() => setStage("commitment")} style={{ marginTop: "1rem", padding: "12px 20px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}>Continue</button>
              </div>
            );
          })()}

          {stage === "commitment" && (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem", textAlign: "center" }}>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.78)" }}>
                If the review identifies the blocker clearly, are you willing to act on it within 48 hours?
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => { setCommitted(true); setCurrentIndex(2); setStage("questions"); }}
                  style={{ padding: "12px 20px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Yes, continue
                </button>
                <button
                  type="button"
                  onClick={() => { setCommitted(false); setCurrentIndex(2); setStage("questions"); }}
                  style={{ padding: "12px 20px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "transparent", color: "rgba(255,255,255,0.60)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Continue without commitment
                </button>
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
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}80` }}>
                  Diagnosis
                </div>
                <div style={{ marginTop: "0.45rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.25rem", lineHeight: 1.4, color: "rgba(255,255,255,0.92)" }}>
                  This is not an execution problem.
                </div>
                <div style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.25rem", lineHeight: 1.4, color: "rgba(255,255,255,0.92)", marginTop: "0.15rem" }}>
                  It is a decision structure problem.
                </div>
                <div style={{ marginTop: "0.6rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.9rem", lineHeight: 1.6, color: `${GOLD}CC` }}>
                  Current condition: {result.conditionLabel}
                </div>
              </div>

              {result.synthesis ? (
                <>
                  <Section title="Summary" body={result.synthesis.verdict} />
                  <Section title="Directive" body={result.synthesis.concreteMove} />
                  <Section title="Required action" body={result.synthesis.avoidedDecision} />
                  <Section title="Recommended next step" body={result.synthesis.whyPriorAttemptsFailed} />
                </>
              ) : null}

              {result.forecast ? (
                <Section
                  title="Escalation status"
                  body={result.forecast.controlShiftSummary}
                />
              ) : null}

              {result.arbiterMessage ? (
                <Section title="Continuity note" body={result.arbiterMessage} />
              ) : null}

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={resetDiagnostic}
                  style={{ padding: "12px 18px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "transparent", color: "rgba(255,255,255,0.60)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Start again
                </button>
                <a
                  href="/diagnostics/executive-reporting"
                  style={{ padding: "12px 18px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}
                >
                  Open executive reporting
                </a>
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
