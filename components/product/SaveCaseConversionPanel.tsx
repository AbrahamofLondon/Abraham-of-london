/**
 * components/product/SaveCaseConversionPanel.tsx
 *
 * Conversion panel placed at the bottom of every result surface.
 * Turns a session-based result into a governed case.
 *
 * Three auth states:
 *   Anonymous  → "Create free account and save this case" (redirects to auth)
 *   Authenticated → "Save this case to Decision Centre" (saves via API)
 *   Saved      → "Saved as CASE-XXXX. Open in Decision Centre"
 *
 * Three-tier CTA hierarchy:
 *   Primary:   Save this case
 *   Secondary: Send result to self
 *   Tertiary:  Continue without saving
 *
 * No result surface should end without this panel or an equivalent.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Archive, Mail, CheckCircle2 } from "lucide-react";

import { trackLaunch } from "@/lib/analytics/client-launch-events";
import {
  storePendingSessionCase,
  type SessionCaseCarryForwardPayload,
} from "@/lib/product/session-case-continuity";
import {
  deriveResultPathwayState,
  type ResultPathwayEvidenceState,
  type ResultPathwaySurface,
  type ResultPathwayUserState,
} from "@/lib/product/result-pathway-state";
import FreeTierUpgradeModal from "./FreeTierUpgradeModal";
import ResultPathwayPanel from "./ResultPathwayPanel";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Types ───────────────────────────────────────────────────────────────────

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; caseRef: string }
  | { status: "error"; message: string };

export type SaveCaseConversionPanelProps = {
  /** The carry-forward payload built by the surface's result builder. */
  payload: SessionCaseCarryForwardPayload;

  /**
   * Optional email to pre-fill the "Send to self" flow.
   * If omitted, the API will attempt to use the session email.
   */
  sendToSelfEmail?: string | null;

  /**
   * Override the "Continue without saving" href.
   * Defaults to "#" (no-op anchor). Pass the next meaningful page if known.
   */
  continueHref?: string;

  /**
   * Optional callback when a case is successfully saved.
   * Called with the saved caseRef.
   */
  onSaved?: (caseRef: string) => void;
  /** Surface-specific pathway framing. */
  surface?: ResultPathwaySurface;
  /** Evidence state used to determine eligible secondary pathways. */
  evidenceState?: ResultPathwayEvidenceState;
  /** The earned route surfaced by the assessment result, if one exists. */
  earnedRoute?: Parameters<typeof deriveResultPathwayState>[0]["earnedRoute"];
  /** Optional known tier when the parent surface already resolved it. */
  userStateOverride?: ResultPathwayUserState;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SaveCaseConversionPanel({
  payload,
  sendToSelfEmail,
  continueHref = "#",
  onSaved,
  surface,
  evidenceState = "basic",
  earnedRoute,
  userStateOverride,
}: SaveCaseConversionPanelProps) {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated" && !!session;
  const isLoadingAuth = sessionStatus === "loading";

  const [saveState, setSaveState] = React.useState<SaveState>({ status: "idle" });
  const [dismissed, setDismissed] = React.useState(false);
  const [detectedUserState, setDetectedUserState] =
    React.useState<ResultPathwayUserState>("anonymous");

  // Track panel impression once
  React.useEffect(() => {
    trackLaunch("save_case_prompt_seen", "save_case_conversion_panel");
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setDetectedUserState("anonymous");
      return;
    }

    let active = true;
    fetch("/api/trial/status")
      .then((response) => response.json())
      .then((data: { trial?: { status?: string } }) => {
        if (!active) return;
        if (data.trial?.status === "ACTIVE") {
          setDetectedUserState("trial");
        } else if (data.trial?.status === "CONVERTED") {
          setDetectedUserState("professional");
        } else {
          setDetectedUserState("authenticated_free");
        }
      })
      .catch(() => {
        if (active) setDetectedUserState("authenticated_free");
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  async function handleSave() {
    trackLaunch("save_case_clicked", "save_case_conversion_panel");

    // Anonymous user — store carry-forward and redirect to auth
    if (!isAuthenticated) {
      storePendingSessionCase(payload);
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(
        "/decision-centre?continueCase=1",
      )}`;
      return;
    }

    setSaveState({ status: "saving" });

    try {
      const response = await fetch("/api/decision-centre/save-session-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        caseRef?: string;
        message?: string;
      };

      if (response.status === 401 || json.reason === "AUTH_REQUIRED") {
        storePendingSessionCase(payload);
        window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(
          "/decision-centre?continueCase=1",
        )}`;
        return;
      }

      // Free tier limit reached — show upgrade modal
      if (json.reason === "FREE_TIER_LIMIT_REACHED") {
        setSaveState({ status: "error", message: "Free tier limit reached" });
        return;
      }

      if (!response.ok || !json.ok || !json.caseRef) {
        setSaveState({
          status: "error",
          message: json.message || "The case could not be saved. Please try again.",
        });
        return;
      }

      trackLaunch("case_saved", "save_case_conversion_panel");
      setSaveState({ status: "saved", caseRef: json.caseRef });
      onSaved?.(json.caseRef);
    } catch {
      setSaveState({
        status: "error",
        message: "Could not reach the server. Please try again.",
      });
    }
  }

  function handleSendToSelf() {
    trackLaunch("send_to_self_clicked", "save_case_conversion_panel");
  }

  const resolvedSurface = surface ?? surfaceFromPayload(payload);
  const resolvedUserState: ResultPathwayUserState =
    userStateOverride ?? detectedUserState;
  const pathwayState = deriveResultPathwayState({
    surface: resolvedSurface,
    persistence: saveState.status === "saved" ? "saved_case" : "session_only",
    userState: resolvedUserState,
    evidenceState,
    caseId: saveState.status === "saved" ? saveState.caseRef : null,
    earnedRoute,
  });

  if (dismissed) return null;

  // ── Saved state ────────────────────────────────────────────────────────────
  if (saveState.status === "saved") {
    return (
      <div aria-label="Case saved">
        <div
          style={{
            border: `1px solid rgba(100,220,140,0.25)`,
            backgroundColor: "rgba(100,220,140,0.03)",
            padding: "0.8rem 1rem",
            marginBottom: "10px",
          }}
        >
          <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "rgba(100,220,140,0.8)" }} />
          <p
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(100,220,140,0.85)",
            }}
          >
            Saved as {saveState.caseRef}
          </p>
          </div>
        </div>
        <ResultPathwayPanel state={pathwayState} />
      </div>
    );
  }

  // Free tier limit reached — show upgrade modal
  if (saveState.status === "error" && saveState.message === "Free tier limit reached") {
    return (
      <FreeTierUpgradeModal
        activeCaseCount={3}
        onDismiss={() => setSaveState({ status: "idle" })}
      />
    );
  }

  return (
    <section aria-label="Save governed case">
      <ResultPathwayPanel
        state={pathwayState}
        primaryActionNode={
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState.status === "saving" || isLoadingAuth}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              border: `1px solid ${GOLD}55`,
              backgroundColor: `${GOLD}12`,
              color: `${GOLD}DD`,
              padding: "0.7rem 1.1rem",
              cursor:
                saveState.status === "saving" || isLoadingAuth
                  ? "not-allowed"
                  : "pointer",
              opacity: saveState.status === "saving" || isLoadingAuth ? 0.65 : 1,
            }}
          >
            <Archive className="h-3.5 w-3.5" />
            {saveState.status === "saving" ? "Saving…" : pathwayState.primaryAction.label}
          </button>
        }
        secondaryActionNodes={{
          send_to_self: (
            <Link
              href={
                sendToSelfEmail
                  ? `/api/tools/send-to-self?email=${encodeURIComponent(sendToSelfEmail)}`
                  : "/auth/signin?callbackUrl=/decision-centre"
              }
              onClick={handleSendToSelf}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "7.5px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.42)",
                border: "1px solid rgba(255,255,255,0.10)",
                backgroundColor: "rgba(255,255,255,0.02)",
                padding: "0.55rem 0.9rem",
                textDecoration: "none",
              }}
            >
              <Mail className="h-3 w-3" />
              {resolvedSurface === "board_summary" ? "Send preview to self" : "Send result to self"}
            </Link>
          ),
        }}
      />

      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.20)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.65rem 0.5rem",
          marginTop: "0.35rem",
        }}
      >
        Continue without saving
      </button>

      {/* Error state */}
      {saveState.status === "error" && (
        <p
          style={{
            marginTop: "0.75rem",
            ...serif,
            fontSize: "0.85rem",
            lineHeight: 1.5,
            color: "rgba(255,120,120,0.8)",
          }}
        >
          {saveState.message}
        </p>
      )}
    </section>
  );
}

function surfaceFromPayload(payload: SessionCaseCarryForwardPayload): ResultPathwaySurface {
  switch (payload.source) {
    case "DECISION_DELAY_CALCULATOR":
      return "decision_delay";
    case "FAST_DIAGNOSTIC":
      return "fast_diagnostic";
    case "BOARD_SUMMARY":
      return "board_summary";
    case "PURPOSE_ALIGNMENT":
      return "purpose_alignment";
    case "CONSTITUTIONAL_DIAGNOSTIC":
      return "constitutional";
    case "TEAM_ASSESSMENT":
      return "team";
    case "ENTERPRISE_ASSESSMENT":
      return "enterprise";
    case "GENERIC_ASSESSMENT":
      return "fast_diagnostic";
  }
}
