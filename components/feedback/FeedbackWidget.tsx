"use client";

/**
 * Lightweight product judgement widget.
 *
 * Backward compatible with the old { surface, subjectId } usage while allowing
 * richer governed feedback context when product surfaces can provide it.
 */

import * as React from "react";
import { CheckCircle2, CircleHelp, ThumbsDown, X } from "lucide-react";
import type { FeedbackCategory, FeedbackRating } from "@/lib/feedback/feedback-types";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type Props = {
  surface: string;
  subjectId?: string;
  subjectType?: string;
  productCode?: string;
  evidenceHash?: string;
  artifactVersion?: string | number;
  orderId?: string;
  artifactId?: string;
  outcomeHypothesisId?: string;
  falsificationEntryId?: string;
  retainerCycleId?: string;
  caseStudyId?: string;
  compact?: boolean;
  requireCategoryOnNegative?: boolean;
};

type State = "idle" | "details" | "submitting" | "done" | "error";

const categoryOptions: Array<{ value: FeedbackCategory; label: string }> = [
  { value: "clarity", label: "Clarity" },
  { value: "accuracy", label: "Accuracy" },
  { value: "usefulness", label: "Usefulness" },
  { value: "actionability", label: "Actionability" },
  { value: "trust", label: "Trust" },
  { value: "evidence_quality", label: "Evidence quality" },
  { value: "delivery_quality", label: "Delivery quality" },
];

function iconButtonStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? `${GOLD}12` : "none",
    border: active ? `1px solid ${GOLD}55` : "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
    padding: "6px 10px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: active ? `${GOLD}DD` : "rgba(255,255,255,0.42)",
  };
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    ...mono,
    fontSize: "7px",
    letterSpacing: 0,
    textTransform: "uppercase",
    border: active ? `1px solid ${GOLD}55` : "1px solid rgba(255,255,255,0.08)",
    background: active ? `${GOLD}10` : "rgba(255,255,255,0.02)",
    color: active ? `${GOLD}DD` : "rgba(255,255,255,0.44)",
    padding: "6px 8px",
    cursor: "pointer",
  };
}

export default function FeedbackWidget({
  surface,
  subjectId,
  subjectType,
  productCode,
  evidenceHash,
  artifactVersion,
  orderId,
  artifactId,
  outcomeHypothesisId,
  falsificationEntryId,
  retainerCycleId,
  caseStudyId,
  compact = false,
  requireCategoryOnNegative = true,
}: Props) {
  const [state, setState] = React.useState<State>("idle");
  const [rating, setRating] = React.useState<FeedbackRating | null>(null);
  const [category, setCategory] = React.useState<FeedbackCategory | null>(null);
  const [confidence, setConfidence] = React.useState(3);
  const [comment, setComment] = React.useState("");
  const [followupRequested, setFollowupRequested] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [message, setMessage] = React.useState("Feedback received. Thank you.");
  const [nextActions, setNextActions] = React.useState<Array<{ id: string; label: string; href: string }>>([]);

  if (dismissed) return null;

  const needsCategory = rating === "negative" || rating === "neutral";
  const categoryRequired = requireCategoryOnNegative && needsCategory;
  const canSubmit = Boolean(rating) && (!categoryRequired || Boolean(category));

  async function submit() {
    if (!rating || !canSubmit) return;
    setState("submitting");
    try {
      const payload = {
        surface,
        subjectId,
        subjectType,
        productCode,
        evidenceHash,
        artifactVersion,
        orderId,
        artifactId,
        outcomeHypothesisId,
        falsificationEntryId,
        retainerCycleId,
        caseStudyId,
        rating,
        category: category ?? "usefulness",
        confidence,
        comment: comment.trim() || null,
        followupRequested,
        sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      };

      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error("feedback_submit_failed");
      if (data?.publicMessage && typeof data.publicMessage === "string") {
        setMessage(data.publicMessage);
      }
      if (Array.isArray(data?.nextActions)) {
        setNextActions(
          data.nextActions
            .filter((item: unknown): item is { id: string; label: string; href: string } => (
              Boolean(item) &&
              typeof (item as { id?: unknown }).id === "string" &&
              typeof (item as { label?: unknown }).label === "string" &&
              typeof (item as { href?: unknown }).href === "string"
            ))
            .slice(0, 3),
        );
      }
      setState("done");
    } catch {
      setState("error");
    }
  }

  function chooseRating(next: FeedbackRating) {
    setRating(next);
    setCategory(next === "positive" ? "usefulness" : null);
    setState("details");
  }

  return (
    <div
      role="region"
      aria-label="Feedback"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        padding: compact ? "12px 14px" : "14px 18px",
        marginTop: compact ? "1rem" : "2rem",
        position: "relative",
      }}
    >
      <button
        aria-label="Dismiss feedback"
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 2,
          display: "flex",
        }}
      >
        <X style={{ width: 12, height: 12, color: "rgba(255,255,255,0.18)" }} />
      </button>

      {state === "idle" && (
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
            Was this a useful signal?
          </span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button aria-label="Useful" onClick={() => chooseRating("positive")} style={iconButtonStyle(false)}>
              <CheckCircle2 style={{ width: 12, height: 12 }} />
              <span style={{ ...mono, fontSize: "7px", letterSpacing: 0 }}>Useful</span>
            </button>
            <button aria-label="Not useful" onClick={() => chooseRating("negative")} style={iconButtonStyle(false)}>
              <ThumbsDown style={{ width: 12, height: 12 }} />
              <span style={{ ...mono, fontSize: "7px", letterSpacing: 0 }}>Not useful</span>
            </button>
            <button aria-label="Unsure" onClick={() => chooseRating("neutral")} style={iconButtonStyle(false)}>
              <CircleHelp style={{ width: 12, height: 12 }} />
              <span style={{ ...mono, fontSize: "7px", letterSpacing: 0 }}>Unsure</span>
            </button>
          </div>
        </div>
      )}

      {state === "details" && (
        <div>
          {needsCategory && (
            <div style={{ marginBottom: "12px" }}>
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "8px" }}>
                What affected your judgement?
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    style={chipStyle(category === option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: "12px" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "8px" }}>
              Confidence
            </p>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setConfidence(value)} style={chipStyle(confidence === value)}>
                  {value}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="What should be improved?"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.62)",
              padding: "8px 10px",
              fontSize: "12px",
              fontFamily: "Georgia, serif",
              resize: "vertical",
              boxSizing: "border-box",
              lineHeight: 1.6,
            }}
          />
          <p style={{ ...mono, fontSize: "6px", letterSpacing: 0, color: "rgba(255,255,255,0.20)", marginTop: "5px", lineHeight: 1.6 }}>
            Do not include confidential, legal, personal, or client-identifying information.
          </p>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", color: "rgba(255,255,255,0.42)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={followupRequested}
              onChange={(e) => setFollowupRequested(e.target.checked)}
            />
            <span style={{ ...mono, fontSize: "7px", letterSpacing: 0, textTransform: "uppercase" }}>
              I want someone to follow up
            </span>
          </label>

          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canSubmit}
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                padding: "6px 12px",
                border: `1px solid ${GOLD}40`,
                background: canSubmit ? `${GOLD}0A` : "rgba(255,255,255,0.02)",
                color: canSubmit ? `${GOLD}CC` : "rgba(255,255,255,0.22)",
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => setState("idle")}
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                padding: "6px 12px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "none",
                color: "rgba(255,255,255,0.30)",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {state === "submitting" && (
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
          Sending...
        </p>
      )}

      {state === "done" && (
        <div>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)", lineHeight: 1.7 }}>
            {message}
          </p>
          {nextActions.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
              {nextActions.map((action) => (
                <a
                  key={action.id}
                  href={action.href}
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: `${GOLD}D0`,
                    textDecoration: "none",
                    border: `1px solid ${GOLD}40`,
                    padding: "6px 9px",
                    background: `${GOLD}08`,
                  }}
                >
                  {action.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {state === "error" && (
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(220,50,50,0.65)" }}>
          Could not send feedback. Try again later.
        </p>
      )}
    </div>
  );
}
