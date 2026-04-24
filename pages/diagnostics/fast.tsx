/**
 * Fast Diagnostic — 6 questions, 3 minutes, one decision signal.
 *
 * For cold traffic from LinkedIn DMs and outreach links.
 * No paid CTA before the result. Value delivered first.
 * Routes to full Purpose/Constitutional only after value.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { dualAxisScore, detectInternalContradictions } from "@/lib/scoring-math";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type FastQuestion = {
  id: string;
  domain: string;
  statement: string;
};

const QUESTIONS: FastQuestion[] = [
  { id: "fq1", domain: "identity", statement: "I can state in one sentence what I am actually responsible for deciding — and the people around me would agree." },
  { id: "fq2", domain: "decision", statement: "The last time I faced a decision under pressure, I acted on principle — not on convenience or politics." },
  { id: "fq3", domain: "authority", statement: "For the most important open decision right now, there is one person who owns it — and that person knows it." },
  { id: "fq4", domain: "execution", statement: "If I asked five people in my organisation what the current priority is, they would give the same answer." },
  { id: "fq5", domain: "trust", statement: "The people executing decisions believe leadership understands what it is actually asking of them." },
  { id: "fq6", domain: "friction", statement: "Things that should take days are taking weeks — and no one has named why." },
];

type Answer = { resonance: number; certainty: number };

const FastDiagnosticPage: NextPage = () => {
  const [answers, setAnswers] = React.useState<Record<string, Answer>>({});
  const [currentQ, setCurrentQ] = React.useState(0);
  const [showResult, setShowResult] = React.useState(false);
  const startTime = React.useRef(Date.now());

  React.useEffect(() => {
    track("fast_diagnostic_started");
  }, []);

  const answered = Object.keys(answers).length;
  const complete = answered === QUESTIONS.length;

  function handleAnswer(qid: string, field: "resonance" | "certainty", value: number) {
    setAnswers((prev) => ({
      ...prev,
      [qid]: { ...(prev[qid] ?? { resonance: 5, certainty: 5 }), [field]: value },
    }));
  }

  function handleNext() {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((q) => q + 1);
    } else if (complete) {
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      track("fast_diagnostic_completed", { elapsed_seconds: elapsed, question_count: QUESTIONS.length });
      setShowResult(true);
    }
  }

  // Compute result
  const domainScores = React.useMemo(() => {
    if (!complete) return [];
    return QUESTIONS.map((q) => {
      const a = answers[q.id]!;
      return { domain: q.domain, score: dualAxisScore(a.resonance, a.certainty) };
    });
  }, [answers, complete]);

  const consistency = React.useMemo(() => {
    if (domainScores.length === 0) return null;
    return detectInternalContradictions(domainScores, 30);
  }, [domainScores]);

  const weakest = React.useMemo(() => {
    if (domainScores.length === 0) return null;
    return [...domainScores].sort((a, b) => a.score - b.score)[0]!;
  }, [domainScores]);

  const avgScore = React.useMemo(() => {
    if (domainScores.length === 0) return 0;
    return Math.round(domainScores.reduce((s, d) => s + d.score, 0) / domainScores.length);
  }, [domainScores]);

  const q = QUESTIONS[currentQ]!;
  const currentAnswer = answers[q.id];

  if (showResult && weakest && consistency) {
    const signal = weakest.score < 35 ? "critical" : weakest.score < 55 ? "active" : "contained";
    const decisionSignal = weakest.domain === "identity"
      ? "Your mandate is unclear. Decisions downstream of an unclear mandate are structurally compromised."
      : weakest.domain === "decision"
      ? "Decision integrity is the weakest signal. Under pressure, decisions are being made on convenience rather than principle."
      : weakest.domain === "authority"
      ? "Authority ownership is unclear. The most important decision has no named owner."
      : weakest.domain === "execution"
      ? "Execution coherence is weak. Different parts of the organisation are working from different priorities."
      : weakest.domain === "trust"
      ? "Trust between leadership and execution is low. People are hedging rather than committing."
      : "Internal friction is slowing decisions. Things that should be fast are being blocked without named cause.";

    const move = weakest.domain === "identity"
      ? "Write your mandate in one sentence. Ask one person if they recognise it."
      : weakest.domain === "decision"
      ? "Name the decision you are avoiding. Write it down. Assign a deadline."
      : weakest.domain === "authority"
      ? "For the most contested current decision: name who owns it. Tell them."
      : weakest.domain === "execution"
      ? "Ask three people what the current priority is. Compare the answers."
      : weakest.domain === "trust"
      ? "Ask one team member what they think leadership misunderstands. Listen."
      : "Name the one thing that should take days but takes weeks. Ask why.";

    return (
      <Layout title="Fast Diagnostic — Result" description="Decision signal from 6 questions">
        <Head><meta name="robots" content="noindex" /></Head>
        <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <div className="mx-auto max-w-2xl">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
              Decision signal · 6 questions · {Math.round((Date.now() - startTime.current) / 1000)}s
            </span>

            {/* Primary signal */}
            <div style={{ marginTop: "1.5rem" }}>
              <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: signal === "critical" ? "rgba(252,165,165,0.70)" : signal === "active" ? `${GOLD}CC` : "rgba(110,231,183,0.60)", fontWeight: 700 }}>
                {signal === "critical" ? "CRITICAL SIGNAL" : signal === "active" ? "ACTIVE SIGNAL" : "CONTAINED"}
              </span>
              <p style={{ ...serif, fontSize: "1.15rem", lineHeight: 1.6, color: "rgba(255,255,255,0.75)", marginTop: "0.5rem", maxWidth: "52ch" }}>
                {decisionSignal}
              </p>
            </div>

            {/* One move */}
            <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem", marginTop: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}70` }}>
                One move — within 72 hours
              </span>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.75, color: "rgba(255,255,255,0.75)", marginTop: "0.25rem", maxWidth: "52ch" }}>
                {move}
              </p>
            </div>

            {/* Contradictions */}
            {consistency.contradictions.length > 0 && (
              <div style={{ border: "1px solid rgba(253,186,116,0.15)", padding: "0.85rem", marginTop: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.50)" }}>
                  Internal contradiction detected
                </span>
                <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(253,186,116,0.55)", marginTop: "0.15rem", maxWidth: "52ch" }}>
                  {consistency.contradictions[0]!.note}
                </p>
              </div>
            )}

            {/* If unchanged */}
            <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(252,165,165,0.35)", marginTop: "1rem", fontStyle: "italic", maxWidth: "52ch" }}>
              This condition compounds whether or not you act on it. Delay does not preserve the current state.
            </p>

            {/* Validity */}
            <p style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.20)", marginTop: "1rem" }}>
              Based on 6 self-reported responses. This identifies a likely pressure point, not a confirmed condition. Strongest when compared against the full diagnostic.
            </p>

            {/* Route to full diagnostic — AFTER value */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem", marginTop: "1.5rem" }}>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", maxWidth: "52ch" }}>
                You now have the signal. The full diagnostic tests whether this is personal or structural — and gives you a deeper evidence chain.
              </p>
              <div className="flex gap-3 mt-4">
                <Link href="/diagnostics/constitutional-diagnostic" className="inline-flex items-center gap-2" style={{ padding: "10px 20px", border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
                  Full diagnostic · 6 min <ArrowRight style={{ width: 10, height: 10 }} />
                </Link>
                <Link href="/diagnostics" className="inline-flex items-center gap-2" style={{ padding: "10px 20px", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
                  All diagnostics
                </Link>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title="Fast Diagnostic" description="6 questions. One decision signal. 3 minutes.">
      <Head><meta name="robots" content="noindex" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-2xl">
          {/* Progress */}
          <div className="flex items-center justify-between mb-6">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
              Fast diagnostic
            </span>
            <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.30)" }}>
              {currentQ + 1} / {QUESTIONS.length}
            </span>
          </div>

          <div className="flex gap-1 mb-8">
            {QUESTIONS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: "2px", backgroundColor: i <= currentQ ? `${GOLD}80` : "rgba(255,255,255,0.06)" }} />
            ))}
          </div>

          {/* Question */}
          <p style={{ ...serif, fontSize: "1.2rem", lineHeight: 1.6, color: "rgba(255,255,255,0.80)", maxWidth: "48ch" }}>
            {q.statement}
          </p>

          {/* Dual-axis inputs */}
          <div className="mt-8 space-y-5">
            <div>
              <label style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "0.5rem" }}>
                How true is this? (0 = not at all — 10 = completely)
              </label>
              <input
                type="range" min={0} max={10} step={1}
                value={currentAnswer?.resonance ?? 5}
                onChange={(e) => handleAnswer(q.id, "resonance", Number(e.target.value))}
                style={{ width: "100%", accentColor: GOLD }}
              />
              <div className="flex justify-between" style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.18)" }}>
                <span>Not at all</span>
                <span style={{ color: `${GOLD}80` }}>{currentAnswer?.resonance ?? 5}</span>
                <span>Completely</span>
              </div>
            </div>

            <div>
              <label style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "0.5rem" }}>
                How certain are you? (0 = guessing — 10 = verified)
              </label>
              <input
                type="range" min={0} max={10} step={1}
                value={currentAnswer?.certainty ?? 5}
                onChange={(e) => handleAnswer(q.id, "certainty", Number(e.target.value))}
                style={{ width: "100%", accentColor: GOLD }}
              />
              <div className="flex justify-between" style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.18)" }}>
                <span>Guessing</span>
                <span style={{ color: `${GOLD}80` }}>{currentAnswer?.certainty ?? 5}</span>
                <span>Verified</span>
              </div>
            </div>
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={handleNext}
            disabled={!currentAnswer}
            className="mt-8 inline-flex items-center gap-2"
            style={{
              padding: "11px 22px",
              border: `1px solid ${currentAnswer ? `${GOLD}60` : "rgba(255,255,255,0.08)"}`,
              backgroundColor: currentAnswer ? `${GOLD}10` : "transparent",
              color: currentAnswer ? `${GOLD}CC` : "rgba(255,255,255,0.20)",
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              cursor: currentAnswer ? "pointer" : "default",
            }}
          >
            {currentQ === QUESTIONS.length - 1 ? "See result" : "Next"} <ArrowRight style={{ width: 10, height: 10 }} />
          </button>

          <p style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.12)", marginTop: "1.5rem" }}>
            6 questions · 3 minutes · No account required
          </p>
        </div>
      </main>
    </Layout>
  );
};

export default FastDiagnosticPage;
