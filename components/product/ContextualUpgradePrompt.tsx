/**
 * components/product/ContextualUpgradePrompt.tsx
 *
 * Contextual upgrade prompts shown when a free user attempts a
 * Professional-only action.
 *
 * Each prompt is specific to the attempted action. No generic
 * "Upgrade now" messaging.
 *
 * Usage:
 *   <ContextualUpgradePrompt
 *     action="export_evidence"
 *     onDismiss={() => setShowPrompt(false)}
 *   />
 */

import * as React from "react";
import Link from "next/link";
import { trackCommercialEvent } from "@/lib/product/commercial-analytics";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

export type UpgradeAction =
  | "create_fourth_case"
  | "request_return_brief"
  | "export_evidence"
  | "share_case"
  | "invite_organisation_member"
  | "access_advanced_benchmark"
  | "create_api_key";

type ActionConfig = {
  title: string;
  body: string;
  professionalFeature: string;
};

const ACTION_CONFIG: Record<UpgradeAction, ActionConfig> = {
  create_fourth_case: {
    title: "Free tier active case limit reached",
    body: "You have reached the free limit of 3 active governed cases. Your existing cases remain readable. Professional preserves the governed record beyond the free active-case limit so more live cases can stay active over time.",
    professionalFeature: "Unlimited active governed cases",
  },
  request_return_brief: {
    title: "Return Brief generation",
    body: "Generating a Return Brief is a Professional continuity feature. Your case remains readable and active in Decision Centre. Professional preserves the governed record when a live case needs structured re-engagement over time.",
    professionalFeature: "Return Brief generation",
  },
  export_evidence: {
    title: "Client-safe evidence export",
    body: "Exporting client-safe evidence is a Professional continuity feature. Your case remains readable. Upgrade only if you need portable evidence export.",
    professionalFeature: "Client-safe evidence export",
  },
  share_case: {
    title: "Case sharing",
    body: "Sharing cases with reviewers is a Professional continuity and collaboration feature. Your case remains private and readable only by you. Upgrade only if the governed record now needs safe external review.",
    professionalFeature: "Case sharing with reviewers",
  },
  invite_organisation_member: {
    title: "Organisation member invitation",
    body: "Inviting organisation members is a Professional workspace feature. Your current workspace remains accessible. Upgrade only if you need to collaborate with additional members.",
    professionalFeature: "Organisation workspace",
  },
  access_advanced_benchmark: {
    title: "Advanced benchmark context",
    body: "Accessing advanced benchmark comparisons is a Professional intelligence feature. Basic benchmark context remains available on the free tier. Upgrade only if you need deeper comparative analysis.",
    professionalFeature: "Advanced benchmark context",
  },
  create_api_key: {
    title: "API key creation",
    body: "Self-serve API key creation is currently available only through Professional / Enterprise pilot access.",
    professionalFeature: "Professional / Enterprise API pilot access",
  },
};

type ContextualUpgradePromptProps = {
  /** The specific action the user attempted */
  action: UpgradeAction;
  /** Called when the user dismisses the prompt */
  onDismiss: () => void;
  /** Optional: called when trial is started successfully */
  onTrialStarted?: () => void;
};

export default function ContextualUpgradePrompt({
  action,
  onDismiss,
  onTrialStarted,
}: ContextualUpgradePromptProps) {
  const config = ACTION_CONFIG[action];
  const [trialState, setTrialState] = React.useState<"idle" | "starting" | "started" | "error">("idle");
  const [trialError, setTrialError] = React.useState("");

  React.useEffect(() => {
    trackCommercialEvent("upgrade_prompt_seen", "contextual_upgrade_prompt", { actionType: action });
  }, [action]);

  async function handleStartTrial() {
    setTrialState("starting");
    setTrialError("");
    try {
      const response = await fetch("/api/trial/start", { method: "POST" });
      const data = await response.json() as { ok: boolean; reason?: string };
      if (data.ok) {
        setTrialState("started");
        trackCommercialEvent("trial_started", "contextual_upgrade_prompt", { actionType: action });
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
          maxWidth: "480px",
          width: "100%",
          backgroundColor: "#0A0A0A",
          border: `1px solid ${GOLD}30`,
          padding: "28px",
        }}
      >
        <p
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: `${GOLD}99`,
            marginBottom: "10px",
          }}
        >
          Professional feature
        </p>

        <h2
          style={{
            ...serif,
            fontSize: "1.2rem",
            lineHeight: 1.3,
            color: "rgba(255,255,255,0.90)",
            marginBottom: "14px",
          }}
        >
          {config.title}
        </h2>

        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.55)",
            marginBottom: "18px",
          }}
        >
          {config.body}
        </p>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "rgba(255,255,255,0.015)",
            padding: "12px 16px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: `${GOLD}77`,
              marginBottom: "4px",
            }}
          >
            Professional feature
          </p>
          <p
            style={{
              fontSize: "12px",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {config.professionalFeature}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {/* Trial CTA */}
          {trialState === "started" ? (
            <span
              style={{
                ...mono,
                fontSize: "7.5px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(110,231,183,0.80)",
                border: "1px solid rgba(110,231,183,0.20)",
                padding: "10px 20px",
                display: "inline-block",
              }}
            >
              Trial started — you can now use this feature
            </span>
          ) : (
            <button
              type="button"
              onClick={handleStartTrial}
              disabled={trialState === "starting"}
              style={{
                ...mono,
                fontSize: "7.5px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: trialState === "starting" ? "rgba(255,255,255,0.30)" : "#0A0A0A",
                backgroundColor: trialState === "starting" ? "rgba(255,255,255,0.10)" : GOLD,
                padding: "10px 20px",
                border: "none",
                cursor: trialState === "starting" ? "not-allowed" : "pointer",
              }}
            >
              {trialState === "starting" ? "Starting..." : "Try Professional free for 7 days"}
            </button>
          )}

          <Link
            href="/pricing"
            onClick={() => trackCommercialEvent("pricing_viewed_from_prompt", "contextual_upgrade_prompt", { actionType: action })}
            style={{
              ...mono,
              fontSize: "7.5px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: `${GOLD}AA`,
              border: `1px solid ${GOLD}25`,
              backgroundColor: "transparent",
              padding: "10px 18px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            View pricing
          </Link>

          <button
            type="button"
            onClick={() => {
              trackCommercialEvent("trial_declined", "contextual_upgrade_prompt", { actionType: action });
              onDismiss();
            }}
            style={{
              ...mono,
              fontSize: "7.5px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "transparent",
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            Continue with free tier
          </button>
        </div>

        {trialState === "error" && (
          <p
            style={{
              marginTop: "10px",
              fontSize: "11px",
              lineHeight: 1.5,
              color: "rgba(252,165,165,0.70)",
            }}
          >
            {trialError}
          </p>
        )}

        <p
          style={{
            marginTop: "14px",
            fontSize: "10px",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.20)",
          }}
        >
          Your existing records remain readable. No data is lost.
        </p>
      </div>
    </div>
  );
}
