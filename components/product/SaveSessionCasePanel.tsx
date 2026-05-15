import * as React from "react";
import Link from "next/link";

import { trackLaunch } from "@/lib/analytics/client-launch-events";
import {
  storePendingSessionCase,
  type SessionCaseCarryForwardPayload,
} from "@/lib/product/session-case-continuity";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; caseRef: string }
  | { status: "error"; message: string };

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

  return (
    <section
      style={{
        border: `1px solid ${GOLD}22`,
        backgroundColor: `${GOLD}05`,
        padding: "1rem 1.25rem",
      }}
    >
      <p
        style={{
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: `${GOLD}AA`,
          marginBottom: "0.55rem",
        }}
      >
        Keep this decision live
      </p>
      <p
        style={{
          ...serif,
          fontSize: "0.9rem",
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.54)",
        }}
      >
        {copy}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", marginTop: "0.9rem" }}>
        {state.status === "saved" ? (
          <Link
            href={`/decision-centre?caseId=${encodeURIComponent(state.caseRef)}`}
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#F5F5F5",
              border: `1px solid ${GOLD}45`,
              backgroundColor: `${GOLD}12`,
              padding: "10px 18px",
              textDecoration: "none",
            }}
          >
            Continue in Decision Centre
          </Link>
        ) : (
          <button
            type="button"
            onClick={saveCase}
            disabled={state.status === "saving"}
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#F5F5F5",
              border: `1px solid ${GOLD}45`,
              backgroundColor: `${GOLD}12`,
              padding: "10px 18px",
              cursor: state.status === "saving" ? "wait" : "pointer",
              opacity: state.status === "saving" ? 0.7 : 1,
            }}
          >
            {state.status === "saving" ? "Saving…" : "Save this case"}
          </button>
        )}
        <span
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.24)",
          }}
        >
          Free account required
        </span>
      </div>
      {state.status === "error" && (
        <p style={{ marginTop: "0.65rem", fontSize: "0.8rem", color: "rgba(252,165,165,0.65)" }}>
          {state.message}
        </p>
      )}
    </section>
  );
}
