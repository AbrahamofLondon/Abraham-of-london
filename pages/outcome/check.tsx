/**
 * Outcome Verification — 30-day follow-up.
 *
 * The system promised it would return. This is the return.
 *
 * Loads the user's spine from DB, shows their original contradiction,
 * move, and forecast. Asks: "Did you take the action? What happened?"
 * Classifies the outcome and feeds it back into the spine.
 */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  XCircle,
} from "lucide-react";
import Layout from "@/components/Layout";
import { loadSpineFromSession } from "@/lib/decision/spine-persistence";
import { advanceSpine, type IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import { saveSpineToSession, persistSpineToDB } from "@/lib/decision/spine-persistence";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type OutcomeStatus = "action_taken" | "partial" | "not_taken" | "different_action";

type Phase = "loading" | "no_spine" | "review" | "capture" | "complete";

const OutcomeCheckPage: NextPage = () => {
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [spine, setSpine] = React.useState<IntelligenceSpine | null>(null);
  const [status, setStatus] = React.useState<OutcomeStatus | null>(null);
  const [outcome, setOutcome] = React.useState("");
  const [whatChanged, setWhatChanged] = React.useState("");

  React.useEffect(() => {
    const loaded = loadSpineFromSession();
    if (loaded) {
      setSpine(loaded);
      setPhase("review");
    } else {
      setPhase("no_spine");
    }
  }, []);

  function handleSubmitOutcome() {
    if (!spine || !status) return;

    const updatedSpine = advanceSpine(
      spine,
      "outcome_verification",
      {
        status,
        outcome,
        whatChanged,
        verifiedAt: new Date().toISOString(),
        originalMove: spine.synthesis?.concreteMove ?? "No move recorded",
        originalContradiction: spine.synthesis?.primaryContradiction ?? "No contradiction recorded",
        daysSinceCreation: Math.round(
          (Date.now() - new Date(spine.createdAt).getTime()) / (1000 * 60 * 60 * 24),
        ),
      },
      status === "action_taken"
        ? "Action was taken. Outcome recorded for pattern calibration."
        : status === "not_taken"
          ? "Action was not taken. The avoidance pattern persists."
          : "Partial or different action taken. Pattern updated.",
    );

    setSpine(updatedSpine);
    saveSpineToSession(updatedSpine);
    void persistSpineToDB(updatedSpine);
    setPhase("complete");
  }

  // ─── LOADING ───
  if (phase === "loading") {
    return (
      <Layout title="Outcome Check" description="Verifying your decision.">
        <main className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.20)" }}>
            Loading assessment history...
          </p>
        </main>
      </Layout>
    );
  }

  // ─── NO SPINE ───
  if (phase === "no_spine") {
    return (
      <Layout title="Outcome Check" description="No prior assessment found.">
        <Head><meta name="robots" content="noindex" /></Head>
        <main className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <div className="max-w-md text-center">
            <Clock className="mx-auto mb-4 h-8 w-8" style={{ color: `${GOLD}60` }} />
            <h1 style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.3rem", color: "rgba(255,255,255,0.80)" }}>
              No prior assessment found
            </h1>
            <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", color: "rgba(255,255,255,0.40)", marginTop: "0.75rem" }}>
              The outcome verification requires a completed decision check. Complete one first, and the system will return in 30 days.
            </p>
            <a href="/diagnostics/fast" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem", padding: "12px 24px", border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Start decision check <ArrowRight style={{ width: 10, height: 10 }} />
            </a>
          </div>
        </main>
      </Layout>
    );
  }

  // ─── REVIEW (show original findings) ───
  if (phase === "review" && spine) {
    const synthesis = spine.synthesis;
    const daysSince = Math.round(
      (Date.now() - new Date(spine.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    return (
      <Layout title="Outcome Check" description="Verifying your decision.">
        <Head><meta name="robots" content="noindex" /></Head>
        <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <div className="mx-auto max-w-xl">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              Outcome verification · {daysSince} days since assessment
            </span>

            <h1 style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.4rem", color: "rgba(255,255,255,0.85)", marginTop: "1.5rem", lineHeight: 1.3 }}>
              The system returns to verify.
            </h1>

            <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", color: "rgba(255,255,255,0.40)", marginTop: "0.75rem", lineHeight: 1.7 }}>
              {daysSince} days ago, the system identified a decision condition and named a specific move. This step checks whether the action held.
            </p>

            {/* Original contradiction */}
            {synthesis?.primaryContradiction && (
              <div style={{ border: "1px solid rgba(252,165,165,0.15)", backgroundColor: "rgba(252,165,165,0.04)", padding: "1rem", marginTop: "1.5rem" }}>
                <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)" }}>
                  Original contradiction
                </span>
                <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)", marginTop: "0.25rem" }}>
                  {synthesis.primaryContradiction}
                </p>
              </div>
            )}

            {/* Original move */}
            {synthesis?.concreteMove && (
              <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}04`, padding: "1rem", marginTop: "1rem" }}>
                <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>
                  Recommended action
                </span>
                <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", marginTop: "0.25rem" }}>
                  {synthesis.concreteMove}
                </p>
              </div>
            )}

            {/* Original forecast */}
            {synthesis?.defaultPathForecast && (
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem", marginTop: "1rem" }}>
                <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
                  Predicted default path
                </span>
                <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.40)", marginTop: "0.25rem" }}>
                  {synthesis.defaultPathForecast}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setPhase("capture")}
              style={{ marginTop: "2rem", padding: "14px 28px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Report what happened <ArrowRight style={{ width: 11, height: 11, display: "inline", marginLeft: "0.5rem", verticalAlign: "middle" }} />
            </button>
          </div>
        </main>
      </Layout>
    );
  }

  // ─── CAPTURE (collect outcome) ───
  if (phase === "capture" && spine) {
    return (
      <Layout title="Outcome Check" description="Recording your outcome.">
        <Head><meta name="robots" content="noindex" /></Head>
        <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <div className="mx-auto max-w-xl space-y-6">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              Outcome capture
            </span>

            {/* Status selection */}
            <div>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1rem", color: "rgba(255,255,255,0.70)", lineHeight: 1.6 }}>
                Did you take the recommended action?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {([
                  { value: "action_taken" as const, label: "Yes — I took it" },
                  { value: "partial" as const, label: "Partially" },
                  { value: "different_action" as const, label: "I did something else" },
                  { value: "not_taken" as const, label: "No — I didn't act" },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    style={{
                      padding: "8px 16px",
                      border: `1px solid ${status === opt.value ? `${GOLD}60` : "rgba(255,255,255,0.08)"}`,
                      backgroundColor: status === opt.value ? `${GOLD}10` : "transparent",
                      color: status === opt.value ? `${GOLD}CC` : "rgba(255,255,255,0.40)",
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Outcome description */}
            <div>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", color: "rgba(255,255,255,0.55)" }}>
                What actually happened?
              </p>
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Describe the outcome. What changed? What didn't?"
                rows={4}
                style={{ width: "100%", marginTop: "0.5rem", padding: "12px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.80)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.6, resize: "none", outline: "none" }}
              />
            </div>

            {/* What changed */}
            <div>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", color: "rgba(255,255,255,0.55)" }}>
                Has the original blocker changed?
              </p>
              <textarea
                value={whatChanged}
                onChange={(e) => setWhatChanged(e.target.value)}
                placeholder="Is the blocker resolved? Did it shift? Is it the same?"
                rows={3}
                style={{ width: "100%", marginTop: "0.5rem", padding: "12px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.80)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.6, resize: "none", outline: "none" }}
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitOutcome}
              disabled={!status || outcome.trim().length < 10}
              style={{
                padding: "14px 28px",
                border: `1px solid ${status && outcome.trim().length >= 10 ? `${GOLD}60` : "rgba(255,255,255,0.06)"}`,
                backgroundColor: status && outcome.trim().length >= 10 ? `${GOLD}10` : "transparent",
                color: status && outcome.trim().length >= 10 ? `${GOLD}CC` : "rgba(255,255,255,0.15)",
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                cursor: status && outcome.trim().length >= 10 ? "pointer" : "default",
              }}
            >
              Submit verification
            </button>
          </div>
        </main>
      </Layout>
    );
  }

  // ─── COMPLETE ───
  if (phase === "complete" && spine) {
    const wasActedOn = status === "action_taken";
    return (
      <Layout title="Outcome Verified" description="Decision outcome recorded.">
        <Head><meta name="robots" content="noindex" /></Head>
        <main className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <div className="max-w-md text-center">
            {wasActedOn ? (
              <CheckCircle2 className="mx-auto mb-4 h-8 w-8" style={{ color: "rgba(110,231,183,0.70)" }} />
            ) : (
              <XCircle className="mx-auto mb-4 h-8 w-8" style={{ color: "rgba(252,165,165,0.60)" }} />
            )}
            <h1 style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.3rem", color: "rgba(255,255,255,0.80)" }}>
              {wasActedOn ? "Outcome recorded" : "Pattern recorded"}
            </h1>
            <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", color: "rgba(255,255,255,0.40)", marginTop: "0.75rem", lineHeight: 1.7, maxWidth: "38ch", marginLeft: "auto", marginRight: "auto" }}>
              {wasActedOn
                ? "The system has recorded the outcome. Future assessments will reference this data for pattern calibration."
                : "The system has recorded that the recommended action was not taken. This pattern will be surfaced in future assessments as recurrence evidence."}
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <a href="/diagnostics/fast" style={{ padding: "10px 20px", border: `1px solid ${GOLD}30`, backgroundColor: `${GOLD}06`, color: `${GOLD}AA`, ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                New assessment
              </a>
              <a href="/diagnostics" style={{ padding: "10px 20px", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Dashboard
              </a>
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  return null;
};

export default OutcomeCheckPage;
