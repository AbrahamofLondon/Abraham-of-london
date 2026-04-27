/**
 * FeedbackLoop — "Was this accurate?" micro-conversion for all assessments.
 */

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, MinusCircle, XCircle, ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const RED = "rgba(252,165,165,";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export type FeedbackLoopProps = {
  assessmentType: string;
  onFeedback?: (response: "yes" | "partial" | "no", reason?: string) => void;
};

function FeedbackButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "8px 6px", border: `1px solid ${color}0.20)`, backgroundColor: `${color}0.04)`, color: `${color}0.60)`, ...mono, fontSize: "7px", letterSpacing: "0.1em", cursor: "pointer" }}>
      {icon} {label}
    </button>
  );
}

export default function FeedbackLoop({ assessmentType, onFeedback }: FeedbackLoopProps) {
  const [given, setGiven] = React.useState<"yes" | "partial" | "no" | null>(null);
  const [reason, setReason] = React.useState("");

  function handleFeedback(response: "yes" | "partial" | "no") {
    setGiven(response);
    track(`${assessmentType}_feedback`, { value: response });
    onFeedback?.(response);
  }

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem", marginTop: "1.5rem" }}>
      {!given ? (
        <>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.45)" }}>Was this accurate?</p>
          <div className="flex gap-2 mt-2">
            <FeedbackButton icon={<CheckCircle2 style={{ width: 12, height: 12 }} />} label="Yes — exactly it" color="rgba(110,231,183," onClick={() => handleFeedback("yes")} />
            <FeedbackButton icon={<MinusCircle style={{ width: 12, height: 12 }} />} label="Partially" color="rgba(253,186,116," onClick={() => handleFeedback("partial")} />
            <FeedbackButton icon={<XCircle style={{ width: 12, height: 12 }} />} label="No — missed" color={RED} onClick={() => handleFeedback("no")} />
          </div>
        </>
      ) : (
        <div style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.20)", letterSpacing: "0.15em" }}>
          {given === "yes" ? (
            <>
              Then you already know this is real.
              <Link href="/diagnostics/executive-reporting" className="mt-2 inline-flex items-center gap-2" style={{ display: "block", color: `${GOLD}CC`, fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                See what this is already costing <ArrowRight style={{ width: 10, height: 10, display: "inline" }} />
              </Link>
            </>
          ) : given === "partial" ? (
            <>
              Noted. The surface read is partial. The next stage tests whether the condition is structural.
              <Link href="/diagnostics/constitutional-diagnostic" className="mt-2 inline-flex items-center gap-2" style={{ display: "block", color: `${GOLD}AA`, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Sharpen the diagnosis <ArrowRight style={{ width: 10, height: 10, display: "inline" }} />
              </Link>
            </>
          ) : (
            <span>
              Where is it wrong?
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What did the system get wrong?"
                rows={2}
                style={{ display: "block", width: "100%", marginTop: "0.5rem", padding: "8px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.70)", fontFamily: "Inter, sans-serif", fontSize: "0.85rem", lineHeight: 1.5, resize: "none", outline: "none" }}
              />
              {reason.trim().length > 10 && (
                <>
                  <button type="button" onClick={() => {
                    track(`${assessmentType}_feedback_reason`, { reason: reason.slice(0, 200) });
                    onFeedback?.("no", reason);
                  }} style={{ marginTop: "0.4rem", padding: "6px 14px", border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}08`, color: `${GOLD}BB`, ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
                    Submit correction
                  </button>
                  <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.20)" }}>
                    Correction recorded. Your next best route is to test the structure more deeply.
                  </p>
                  <Link href="/diagnostics/constitutional-diagnostic" style={{ display: "inline-block", marginTop: "0.3rem", color: `${GOLD}AA`, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Run Constitutional Diagnostic →
                  </Link>
                </>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
