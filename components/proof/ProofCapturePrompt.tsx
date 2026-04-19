"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics/track";

type Accuracy = "precise" | "partial" | "no";
type Usefulness = "yes" | "somewhat" | "no";

type ProofCapturePromptProps = {
  sourceStage: string;
  routeResultType?: string;
  isPaidStage?: boolean;
  mode?: "immediate" | "paid" | "followup";
  compact?: boolean;
};

const GOLD = "#C9A96E";

const accurateParts = [
  ["problem_definition", "Problem definition"],
  ["trajectory_direction", "Trajectory / direction"],
  ["recommendation", "Recommendation"],
  ["team_organisational_diagnosis", "Team / organisational diagnosis"],
  ["consequence_exposure", "Consequence / exposure"],
  ["other", "Other"],
] as const;

const actionOptions = [
  ["take_no_action", "Take no action"],
  ["rerun_better_inputs", "Re-run with better inputs"],
  ["share_with_colleague", "Share with colleague / team"],
  ["use_executive_reporting", "Use Executive Reporting"],
  ["use_strategy_room", "Use Strategy Room"],
  ["act_internally", "Act internally without escalation"],
] as const;

const outcomeOptions = [
  ["clarified_problem", "Clarified the problem"],
  ["changed_decision_making", "Changed decision-making"],
  ["improved_team_alignment", "Improved team alignment"],
  ["reduced_confusion", "Reduced confusion"],
  ["triggered_intervention", "Triggered intervention / escalation"],
  ["prevented_bad_decision", "Prevented a bad decision"],
  ["no_meaningful_change_yet", "No meaningful change yet"],
] as const;

function monoStyle(color = "rgba(255,255,255,0.56)"): React.CSSProperties {
  return {
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: "8px",
    letterSpacing: 0,
    textTransform: "uppercase",
    color,
  };
}

function Button({
  children,
  onClick,
  tone = "neutral",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "neutral" | "good" | "gold" | "bad";
}) {
  const color =
    tone === "good"
      ? "rgba(110,231,183,0.78)"
      : tone === "bad"
        ? "rgba(252,165,165,0.72)"
        : tone === "gold"
          ? GOLD
          : "rgba(255,255,255,0.62)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-all duration-150 hover:opacity-85"
      style={{
        border: `1px solid ${color}40`,
        backgroundColor: "rgba(255,255,255,0.025)",
        color,
        padding: "0.55rem 0.8rem",
        ...monoStyle(color),
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function ProofCapturePrompt({
  sourceStage,
  routeResultType,
  isPaidStage = false,
  mode = "immediate",
  compact = false,
}: ProofCapturePromptProps) {
  const [step, setStep] = React.useState<"initial" | "details" | "done">("initial");
  const [accuracy, setAccuracy] = React.useState<Accuracy | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    track("proof_prompt_shown", { sourceStage, mode, isPaidStage });
  }, [isPaidStage, mode, sourceStage]);

  async function submit(payload: Record<string, unknown>, done = true) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/proof/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceStage,
          routeResultType,
          isPaidStage,
          sourceOrigin: "in_product",
          ...payload,
        }),
      });
      if (!res.ok) throw new Error("proof_submit_failed");
      track(
        mode === "followup"
          ? "proof_followup_submitted"
          : mode === "paid"
            ? "proof_paid_submitted"
            : "proof_submitted",
        { sourceStage, mode, isPaidStage },
      );
      if (done) setStep("done");
    } catch {
      track("proof_submit_failed", { sourceStage, mode });
    } finally {
      setSubmitting(false);
    }
  }

  function submitAccuracy(next: Accuracy) {
    setAccuracy(next);
    void submit(
      {
        proofType: "immediate_accuracy",
        accuracyScore: next,
      },
      next === "no",
    );
    if (next === "no") {
      return;
    }
    setStep("details");
  }

  if (step === "done") {
    return (
      <div
        style={{
          marginTop: compact ? "0.75rem" : "1rem",
          padding: "0.8rem 1rem",
          border: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(255,255,255,0.025)",
        }}
      >
        <p style={monoStyle("rgba(255,255,255,0.42)")}>Recorded. Thank you.</p>
      </div>
    );
  }

  if (mode === "followup") {
    return (
      <div style={{ marginTop: "1rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(0,0,0,0.35)", padding: "1rem" }}>
        <p style={monoStyle(GOLD)}>Follow-up signal</p>
        <p className="mt-3 text-[13px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.70)" }}>
          Did you act on the result?
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button tone="good" onClick={() => setStep("details")}>Yes</Button>
          <Button tone="neutral" onClick={() => void submit({ proofType: "followup_outcome", outcomeCategory: "no_meaningful_change_yet" })}>No</Button>
        </div>
        {step === "details" && (
          <div className="mt-4">
            <p style={monoStyle("rgba(255,255,255,0.45)")}>What changed?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {outcomeOptions.map(([value, label]) => (
                <Button key={value} tone="gold" onClick={() => void submit({ proofType: "followup_outcome", outcomeCategory: value })}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === "paid") {
    return (
      <div style={{ marginTop: "1rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(0,0,0,0.35)", padding: "1rem" }}>
        <p style={monoStyle(GOLD)}>Evidence signal</p>
        <p className="mt-3 text-[13px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.70)" }}>
          Did this make the next move clearer?
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["yes", "somewhat", "no"] as Usefulness[]).map((value) => (
            <Button
              key={value}
              tone={value === "yes" ? "good" : value === "somewhat" ? "gold" : "bad"}
              onClick={() => void submit({ proofType: "paid_stage_signal", usefulnessScore: value, nextMoveClear: value !== "no" })}
            >
              {value === "yes" ? "Yes" : value === "somewhat" ? "Somewhat" : "No"}
            </Button>
          ))}
        </div>

        <div className="mt-4 border-t border-white/[0.08] pt-4">
          <p style={monoStyle("rgba(255,255,255,0.45)")}>
            Was the analysis more specific than generic consulting advice?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["yes", "somewhat", "no"] as Usefulness[]).map((value) => (
              <Button
                key={value}
                tone={value === "yes" ? "good" : value === "somewhat" ? "gold" : "bad"}
                onClick={() => void submit({ proofType: "paid_stage_signal", paidSpecificity: value }, false)}
              >
                {value === "yes" ? "Yes" : value === "somewhat" ? "Somewhat" : "No"}
              </Button>
            ))}
          </div>

          <p className="mt-5" style={monoStyle("rgba(255,255,255,0.45)")}>
            Did it make the cost or consequence clearer?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button tone="good" onClick={() => void submit({ proofType: "paid_stage_signal", consequenceClear: true }, false)}>Yes</Button>
            <Button tone="neutral" onClick={() => void submit({ proofType: "paid_stage_signal", consequenceClear: false }, false)}>No</Button>
          </div>

          <p className="mt-5" style={monoStyle("rgba(255,255,255,0.45)")}>
            Did it justify further action?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button tone="good" onClick={() => void submit({ proofType: "paid_stage_signal", justifiedAction: true })}>Yes</Button>
            <Button tone="neutral" onClick={() => void submit({ proofType: "paid_stage_signal", justifiedAction: false })}>No</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: compact ? "0.75rem" : "1rem",
        padding: compact ? "0.85rem 1rem" : "1rem 1.25rem",
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.025)",
      }}
    >
      <p style={monoStyle("rgba(255,255,255,0.42)")}>Did this accurately reflect your situation?</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button tone="good" onClick={() => submitAccuracy("precise")}>Yes — precisely</Button>
        <Button tone="gold" onClick={() => submitAccuracy("partial")}>Partially</Button>
        <Button tone="bad" onClick={() => submitAccuracy("no")}>No</Button>
      </div>

      {step === "details" && (
        <div className="mt-4 border-t border-white/[0.08] pt-4">
          <p style={monoStyle("rgba(255,255,255,0.45)")}>Which part felt most accurate?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {accurateParts.map(([value, label]) => (
              <Button
                key={value}
                tone="neutral"
                onClick={() =>
                  void submit({
                    proofType: "immediate_accuracy",
                    accuracyScore: accuracy,
                    mostAccuratePart: value,
                  }, false)
                }
              >
                {label}
              </Button>
            ))}
          </div>

          <p className="mt-5" style={monoStyle("rgba(255,255,255,0.45)")}>
            Did this clarify what is actually wrong?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["yes", "somewhat", "no"] as Usefulness[]).map((value) => (
              <Button
                key={value}
                tone={value === "yes" ? "good" : value === "somewhat" ? "gold" : "bad"}
                onClick={() =>
                  void submit({
                    proofType: "usefulness_signal",
                    accuracyScore: accuracy,
                    usefulnessScore: value,
                  }, false)
                }
              >
                {value === "yes" ? "Yes" : value === "somewhat" ? "Somewhat" : "No"}
              </Button>
            ))}
          </div>

          <p className="mt-5" style={monoStyle("rgba(255,255,255,0.45)")}>
            Did this change what you think needs to happen next?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              tone="good"
              onClick={() =>
                void submit({
                  proofType: "usefulness_signal",
                  accuracyScore: accuracy,
                  nextStepChanged: true,
                }, false)
              }
            >
              Yes
            </Button>
            <Button
              tone="neutral"
              onClick={() =>
                void submit({
                  proofType: "usefulness_signal",
                  accuracyScore: accuracy,
                  nextStepChanged: false,
                }, false)
              }
            >
              No
            </Button>
          </div>

          <p className="mt-5" style={monoStyle("rgba(255,255,255,0.45)")}>What are you likely to do next?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {actionOptions.map(([value, label]) => (
              <Button
                key={value}
                tone="gold"
                onClick={() =>
                  void submit({
                    proofType: "action_intent",
                    accuracyScore: accuracy,
                    actionIntent: value,
                  })
                }
              >
                {label} <ArrowRight className="inline h-3 w-3" />
              </Button>
            ))}
          </div>
        </div>
      )}

      {submitting && (
        <p className="mt-3" style={monoStyle("rgba(255,255,255,0.34)")}>Recording...</p>
      )}
    </div>
  );
}
