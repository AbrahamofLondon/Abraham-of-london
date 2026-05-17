/**
 * components/product/FreeTierUpgradeModal.tsx
 *
 * Upgrade prompt shown when a free user attempts to create/save
 * a new active governed case beyond the free tier limit.
 *
 * Does not destroy data. Does not block access to prior records.
 * Does not shame the user. Shows continuity upgrade modal with
 * trial option.
 */

import * as React from "react";
import Link from "next/link";

import {
  FREE_TIER_MAX_ACTIVE_CASES,
  PROFESSIONAL_FEATURE_LIST,
  describeTierFeature,
} from "@/lib/product/free-tier-limits";
import { trackCommercialEvent } from "@/lib/product/commercial-analytics";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

type FreeTierUpgradeModalProps = {
  /** Called when the user dismisses the modal */
  onDismiss: () => void;
  /** Current active case count */
  activeCaseCount: number;
  /** Called when trial is started successfully */
  onTrialStarted?: () => void;
};

export default function FreeTierUpgradeModal({
  onDismiss,
  activeCaseCount,
  onTrialStarted,
}: FreeTierUpgradeModalProps) {
  const [trialState, setTrialState] = React.useState<"idle" | "starting" | "started" | "error">("idle");
  const [trialError, setTrialError] = React.useState("");

  React.useEffect(() => {
    trackCommercialEvent("upgrade_prompt_seen", "free_tier_upgrade_modal", { actionType: "free_case_limit" });
    trackCommercialEvent("free_limit_reached", "free_tier_upgrade_modal", { actionType: "free_case_limit" });
  }, []);

  async function handleStartTrial() {
    setTrialState("starting");
    setTrialError("");
    try {
      const response = await fetch("/api/trial/start", { method: "POST" });
      const data = await response.json() as { ok: boolean; reason?: string };
      if (data.ok) {
        setTrialState("started");
        trackCommercialEvent("trial_started", "free_tier_upgrade_modal", { actionType: "free_case_limit" });
        onTrialStarted?.();
      } else {
        setTrialState("error");
        setTrialError(data.reason ?? "Failed to start trial.");
      }
    } catch {
      setTrialState("error");
      setTrialError("Network error. Please try again.");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.75)",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          backgroundColor: "#0A0A0A",
          border: `1px solid ${GOLD}30`,
          padding: "32px",
        }}
      >
        {/* Title */}
        <p
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: `${GOLD}99`,
            marginBottom: "12px",
          }}
        >
          Free tier limit reached
        </p>

        <h2
          style={{
            ...serif,
            fontSize: "1.35rem",
            lineHeight: 1.3,
            color: "rgba(255,255,255,0.90)",
            marginBottom: "16px",
          }}
        >
          You have reached the free active case limit.
        </h2>

        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.55)",
            marginBottom: "20px",
          }}
        >
          You have {activeCaseCount} active case{activeCaseCount !== 1 ? "s" : ""}.
          Your existing records remain readable. Professional preserves continuity
          beyond the free active-case limit so a new live case can remain active over time.
        </p>

        {/* Feature list */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.02)",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              ...mono,
              fontSize: "7.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: `${GOLD}88`,
              marginBottom: "12px",
            }}
          >
            Try Professional for 7 days
          </p>
          <p
            style={{
              fontSize: "12px",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.40)",
              marginBottom: "12px",
            }}
          >
            Use the full continuity layer before deciding:
          </p>
          <div style={{ display: "grid", gap: "8px" }}>
            {PROFESSIONAL_FEATURE_LIST.map((feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ color: `${GOLD}66`, fontSize: "12px" }}>+</span>
                <span
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.60)",
                  }}
                >
                  {describeTierFeature(feature)}
                </span>
              </div>
            ))}
          </div>
          <p
            style={{
              marginTop: "12px",
              fontSize: "11px",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.30)",
              fontStyle: "italic",
            }}
          >
            If you do not continue, your records remain readable. You can choose which cases stay active.
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* Trial CTA */}
          {trialState === "started" ? (
            <span
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(110,231,183,0.80)",
                border: "1px solid rgba(110,231,183,0.20)",
                padding: "12px 24px",
                display: "inline-block",
              }}
            >
              Trial started — you can now create new cases
            </span>
          ) : (
            <button
              type="button"
              onClick={handleStartTrial}
              disabled={trialState === "starting"}
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: trialState === "starting" ? "rgba(255,255,255,0.30)" : "#0A0A0A",
                backgroundColor: trialState === "starting" ? "rgba(255,255,255,0.10)" : GOLD,
                padding: "12px 24px",
                border: "none",
                cursor: trialState === "starting" ? "not-allowed" : "pointer",
              }}
            >
              {trialState === "starting" ? "Starting trial..." : "Start 7-day Professional trial"}
            </button>
          )}

          {/* Upgrade link */}
          <Link
            href="/pricing"
            onClick={() => trackCommercialEvent("pricing_viewed_from_prompt", "free_tier_upgrade_modal", { actionType: "free_case_limit" })}
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: `${GOLD}AA`,
              border: `1px solid ${GOLD}30`,
              backgroundColor: "transparent",
              padding: "12px 20px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            View pricing
          </Link>

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => {
              trackCommercialEvent("trial_declined", "free_tier_upgrade_modal", { actionType: "free_case_limit" });
              onDismiss();
            }}
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.40)",
              border: "1px solid rgba(255,255,255,0.10)",
              backgroundColor: "transparent",
              padding: "12px 20px",
              cursor: "pointer",
            }}
          >
            Continue with free tier
          </button>
        </div>

        {/* Error state */}
        {trialState === "error" && (
          <p
            style={{
              marginTop: "12px",
              fontSize: "11px",
              lineHeight: 1.5,
              color: "rgba(252,165,165,0.70)",
            }}
          >
            {trialError}
          </p>
        )}

        {/* Reassurance */}
        <p
          style={{
            marginTop: "16px",
            fontSize: "11px",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          Your existing records remain readable. Archived cases remain
          accessible. Basic verification, send-to-self, and the public
          provenance demo remain available on the free tier.
        </p>
      </div>
    </div>
  );
}
