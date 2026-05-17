/**
 * components/feedback/FeedbackWidget.tsx
 *
 * Lightweight, non-intrusive feedback widget.
 * Renders a small thumbs-up / thumbs-down prompt with optional comment.
 * Submits to POST /api/feedback/submit.
 *
 * Props:
 *   surface   — identifies the page/feature (e.g. "return-brief", "decision-centre-case")
 *   subjectId — optional: case ID, report ID, etc.
 *
 * Privacy: no free-text is required. If entered, it is stored as-is.
 * Callers should not place this widget adjacent to sensitive evidence fields.
 */

import * as React from "react";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type Rating = "positive" | "negative";

type Props = {
  surface: string;
  subjectId?: string;
};

type State = "idle" | "rated" | "commenting" | "submitting" | "done" | "error";

export default function FeedbackWidget({ surface, subjectId }: Props) {
  const [state, setState] = React.useState<State>("idle");
  const [rating, setRating] = React.useState<Rating | null>(null);
  const [comment, setComment] = React.useState("");
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  async function submit(r: Rating, c: string) {
    setState("submitting");
    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surface, subjectId, rating: r, comment: c.trim() || null }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  function handleRating(r: Rating) {
    setRating(r);
    setState("commenting");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    void submit(rating, comment);
  }

  function handleSkipComment() {
    if (!rating) return;
    void submit(rating, "");
  }

  return (
    <div
      role="region"
      aria-label="Feedback"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "14px 18px",
        marginTop: "2rem",
        position: "relative",
      }}
    >
      {/* Dismiss */}
      <button
        aria-label="Dismiss feedback"
        onClick={() => setDismissed(true)}
        style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
      >
        <X style={{ width: 12, height: 12, color: "rgba(255,255,255,0.18)" }} />
      </button>

      {state === "idle" && (
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
            Was this useful?
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              aria-label="Useful"
              onClick={() => handleRating("positive")}
              style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", padding: "5px 10px", display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.40)" }}
            >
              <ThumbsUp style={{ width: 12, height: 12 }} />
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.08em" }}>Yes</span>
            </button>
            <button
              aria-label="Not useful"
              onClick={() => handleRating("negative")}
              style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", padding: "5px 10px", display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.40)" }}
            >
              <ThumbsDown style={{ width: 12, height: 12 }} />
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.08em" }}>No</span>
            </button>
          </div>
        </div>
      )}

      {state === "commenting" && (
        <form onSubmit={handleSubmit}>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "10px" }}>
            {rating === "positive" ? "Glad to hear it. Anything to add?" : "What could be improved?"}
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Optional — your feedback is anonymous"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.60)",
              padding: "8px 10px",
              fontSize: "12px",
              fontFamily: "Georgia, serif",
              resize: "vertical",
              boxSizing: "border-box",
              lineHeight: 1.6,
            }}
          />
          <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.18)", marginTop: "5px", lineHeight: 1.6 }}>
            Do not include confidential, legal, personal, or client-identifying information.
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              type="submit"
              style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", textTransform: "uppercase", padding: "5px 12px", border: `1px solid ${GOLD}40`, background: `${GOLD}0A`, color: `${GOLD}CC`, cursor: "pointer" }}
            >
              Submit
            </button>
            <button
              type="button"
              onClick={handleSkipComment}
              style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", textTransform: "uppercase", padding: "5px 12px", border: "1px solid rgba(255,255,255,0.07)", background: "none", color: "rgba(255,255,255,0.28)", cursor: "pointer" }}
            >
              Skip
            </button>
          </div>
        </form>
      )}

      {state === "submitting" && (
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
          Sending...
        </p>
      )}

      {state === "done" && (
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
          Feedback received. Thank you.
        </p>
      )}

      {state === "error" && (
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(220,50,50,0.60)" }}>
          Could not send feedback. Try again later.
        </p>
      )}
    </div>
  );
}
