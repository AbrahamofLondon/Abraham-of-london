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
import { Archive, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

import { trackLaunch } from "@/lib/analytics/client-launch-events";
import {
  storePendingSessionCase,
  type SessionCaseCarryForwardPayload,
} from "@/lib/product/session-case-continuity";

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
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SaveCaseConversionPanel({
  payload,
  sendToSelfEmail,
  continueHref = "#",
  onSaved,
}: SaveCaseConversionPanelProps) {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated" && !!session;
  const isLoadingAuth = sessionStatus === "loading";

  const [saveState, setSaveState] = React.useState<SaveState>({ status: "idle" });
  const [dismissed, setDismissed] = React.useState(false);

  // Track panel impression once
  React.useEffect(() => {
    trackLaunch("save_case_prompt_seen", "save_case_conversion_panel");
  }, []);

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

  if (dismissed) return null;

  // ── Saved state ────────────────────────────────────────────────────────────
  if (saveState.status === "saved") {
    return (
      <section
        style={{
          border: `1px solid rgba(100,220,140,0.25)`,
          backgroundColor: "rgba(100,220,140,0.03)",
          padding: "1rem 1.25rem",
        }}
        aria-label="Case saved"
      >
        <div className="flex items-center gap-2 mb-2">
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
        <Link
          href={`/decision-centre?caseId=${encodeURIComponent(saveState.caseRef)}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: `${GOLD}DD`,
            textDecoration: "none",
            border: `1px solid ${GOLD}44`,
            backgroundColor: `${GOLD}0A`,
            padding: "0.6rem 1rem",
            marginTop: "0.5rem",
          }}
        >
          Open in Decision Centre
          <ArrowRight className="h-3 w-3" />
        </Link>
      </section>
    );
  }

  // ── Primary panel ──────────────────────────────────────────────────────────
  return (
    <section
      style={{
        border: `1px solid ${GOLD}22`,
        backgroundColor: `${GOLD}05`,
        padding: "1.25rem",
      }}
      aria-label="Save governed case"
    >
      {/* Header label */}
      <p
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: `${GOLD}88`,
          marginBottom: "0.65rem",
        }}
      >
        This result is currently session-based
      </p>

      {/* Body copy — verbatim from spec */}
      <p
        style={{
          ...serif,
          fontSize: "0.95rem",
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.55)",
          marginBottom: "0.75rem",
        }}
      >
        Save it as a governed case to keep:
      </p>

      <ul
        className="space-y-1 mb-4 pl-2"
        style={{ listStyle: "none" }}
      >
        {[
          "a case reference",
          "Decision Centre continuity",
          "verification status where supported",
          "future Return Brief eligibility",
          "your next earned action",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span
              style={{
                marginTop: "0.4rem",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                backgroundColor: `${GOLD}66`,
                flexShrink: 0,
              }}
            />
            <p
              style={{
                ...serif,
                fontSize: "0.88rem",
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {item}
            </p>
          </li>
        ))}
      </ul>

      {/* CTA hierarchy */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Primary: Save this case */}
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
            padding: "0.65rem 1.15rem",
            cursor:
              saveState.status === "saving" || isLoadingAuth
                ? "not-allowed"
                : "pointer",
            opacity: saveState.status === "saving" || isLoadingAuth ? 0.65 : 1,
          }}
        >
          <Archive className="h-3.5 w-3.5" />
          {saveState.status === "saving"
            ? "Saving…"
            : isAuthenticated
              ? "Save this case"
              : "Create free account and save this case"}
        </button>

        {/* Secondary: Send result to self */}
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
            fontSize: "8px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.38)",
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.02)",
            padding: "0.65rem 1rem",
            textDecoration: "none",
          }}
        >
          <Mail className="h-3 w-3" />
          Send result to self
        </Link>

        {/* Tertiary: Continue without saving */}
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
          }}
        >
          Continue without saving
        </button>
      </div>

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
