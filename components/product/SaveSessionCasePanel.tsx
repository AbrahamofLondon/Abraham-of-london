/**
 * components/product/SaveSessionCasePanel.tsx
 *
 * Save panel for session-based results.
 * Handles FREE_TIER_LIMIT_REACHED by showing the upgrade modal.
 */

import * as React from "react";
import Link from "next/link";

import { trackLaunch } from "@/lib/analytics/client-launch-events";
import {
  storePendingSessionCase,
  type SessionCaseCarryForwardPayload,
} from "@/lib/product/session-case-continuity";
import FreeTierUpgradeModal from "./FreeTierUpgradeModal";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; caseRef: string }
  | { status: "error"; message: string }
  | { status: "limit_reached"; activeCaseCount: number };

export default function SaveSessionCasePanel({
  payload,
  copy,
}: {
  payload: SessionCaseCarryForwardPayload;
  copy: string;
}) {
  const [state, setState] = React.useState<SaveState>({ status: "idle" });

  async function saveCase() {
    trackLaunch("save_case_clicked", "save_session_case_panel");
    setState({ status: "saving" });
    try {
      const response = await fetch("/api/decision-centre/save-session-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json() as {
        ok?: boolean;
        reason?: string;
        caseRef?: string;
        message?: string;
      };

      if (response.status === 401 || json.reason === "AUTH_REQUIRED") {
        storePendingSessionCase(payload);
        window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent("/decision-centre?continueCase=1")}`;
        return;
      }

      // Free tier limit reached — show upgrade modal
      if (json.reason === "FREE_TIER_LIMIT_REACHED") {
        setState({ status: "limit_reached", activeCaseCount: 3 });
        return;
      }

      if (!response.ok || !json.ok || !json.caseRef) {
        setState({
          status: "error",
          message: json.message || "The case could not be saved yet.",
        });
        return;
      }

      setState({ status: "saved", caseRef: json.caseRef });
    } catch {
      setState({ status: "error", message: "The case could not be saved yet." });
    }
  }

  // Upgrade modal
  if (state.status === "limit_reached") {
    return (
      <FreeTierUpgradeModal
        activeCaseCount={state.activeCaseCount}
        onDismiss={() => setState({ status: "idle" })}
      />
    );
  }

  if (state.status === "saved") {
    return (
      <div style={{ border: `1px solid rgba(100,220,140,0.25)`, backgroundColor: "rgba(100,220,140,0.03)", padding: "1rem 1.25rem" }}>
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(100,220,140,0.85)" }}>
          Saved as {state.caseRef}
        </p>
        <Link href={`/decision-centre/case/${encodeURIComponent(state.caseRef)}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}DD`, textDecoration: "none", border: `1px solid ${GOLD}44`, backgroundColor: `${GOLD}0A`, padding: "0.6rem 1rem", marginTop: "0.5rem" }}>
          Open in Decision Centre
        </Link>
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}05`, padding: "1.25rem" }}>
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.65rem" }}>
        Save this as a governed case
      </p>
      <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)", marginBottom: "0.75rem" }}>
        {copy}
      </p>

      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" onClick={saveCase} disabled={state.status === "saving"}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: state.status === "saving" ? "rgba(255,255,255,0.20)" : "#0A0A0A", backgroundColor: state.status === "saving" ? "rgba(255,255,255,0.06)" : GOLD, padding: "0.7rem 1.2rem", border: "none", cursor: state.status === "saving" ? "not-allowed" : "pointer" }}>
          {state.status === "saving" ? "Saving..." : "Save to Decision Centre"}
        </button>
      </div>

      {state.status === "error" && (
        <p style={{ marginTop: "0.5rem", fontSize: "11px", color: "rgba(252,165,165,0.70)" }}>
          {state.message}
        </p>
      )}
    </div>
  );
}
