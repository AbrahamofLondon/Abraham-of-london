/**
 * components/tools/SendToSelfForm.tsx
 *
 * Shared send-to-self form for governed outputs. Used by Board Summary Preview,
 * Return Brief, Strategy Room Record, Client-Safe Provenance Summary, and
 * Proof Pack surfaces.
 *
 * Rules enforced:
 * - Every send form includes: "This sends a copy or access link. It does not create or alter a governed record."
 * - For previews: "This is a session-derived preview. Save the case to preserve it in Decision Centre."
 * - For live records: "This email references an existing account-bound record."
 * - No marketing subscription.
 * - No raw internal notes, suppression details, actor IDs, or raw evidence.
 */

import * as React from "react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export type SendToSelfSource =
  | "board_summary_preview"
  | "return_brief"
  | "strategy_room_record"
  | "client_safe_provenance"
  | "proof_pack";

export type SendToSelfContent = {
  title: string;
  summary: string;
  nextMove?: string;
  exposureSummary?: string;
  subjectType?: string;
  subjectId?: string;
};

type Props = {
  source: SendToSelfSource;
  content: SendToSelfContent;
  /** Whether this is a live record (account-bound) vs a session-derived preview */
  isLiveRecord: boolean;
  /** Optional custom label for the form header */
  label?: string;
};

export default function SendToSelfForm({ source, content, isLiveRecord, label }: Props) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error" | "unavailable">("idle");
  const [unavailableMessage, setUnavailableMessage] = React.useState<string | null>(null);

  const formLabel = label ?? (isLiveRecord ? "Send record reference to my email" : "Send this summary to my email");

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/tools/send-to-self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source,
          content: {
            title: content.title,
            summary: content.summary,
            nextMove: content.nextMove ?? "",
            exposureSummary: content.exposureSummary ?? "",
            subjectType: content.subjectType ?? "",
            subjectId: content.subjectId ?? "",
          },
        }),
      });
      const json = await response.json();
      if (json.ok) {
        setStatus("sent");
      } else if (json.error === "EMAIL_NOT_CONFIGURED" || response.status === 503) {
        setStatus("unavailable");
        setUnavailableMessage(json.message ?? "Email copy is not currently available. You can still save this case to Decision Centre.");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "unavailable") {
    return (
      <div
        style={{
          marginTop: "16px",
          border: "1px solid rgba(255,255,255,0.06)",
          backgroundColor: "rgba(255,255,255,0.015)",
          padding: "14px 18px",
        }}
      >
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "8px" }}>
          {formLabel}
        </p>
        <p style={{ ...serif, fontSize: "13px", lineHeight: 1.6, color: "rgba(252,165,165,0.55)", marginBottom: "8px" }}>
          {unavailableMessage ?? "Email copy is not currently available. You can still save this case to Decision Centre."}
        </p>
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.16)" }}>
          No marketing. No subscription.
        </p>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div
        style={{
          marginTop: "16px",
          borderLeft: `2px solid rgba(110,231,183,0.25)`,
          backgroundColor: "rgba(110,231,183,0.02)",
          padding: "12px 16px",
        }}
      >
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(110,231,183,0.55)" }}>
          Sent. Check your inbox.
        </p>
        <p style={{ ...serif, fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.40)", marginTop: "4px" }}>
          {isLiveRecord
            ? "This email references an existing account-bound record. It does not create or alter a governed record."
            : "This sends a copy or access link. It does not create or alter a governed record. This is a session-derived preview. Save the case to preserve it in Decision Centre."}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: "16px",
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(255,255,255,0.015)",
        padding: "14px 18px",
      }}
    >
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "8px" }}>
        {formLabel}
      </p>

      {/* Disclaimer — always shown */}
      <p style={{ ...serif, fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.40)", marginBottom: "10px" }}>
        {isLiveRecord
          ? "This email references an existing account-bound record. It does not create or alter a governed record."
          : "This sends a copy or access link. It does not create or alter a governed record. This is a session-derived preview. Save the case to preserve it in Decision Centre."}
      </p>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder="your@email.com"
          autoComplete="email"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.10)",
            backgroundColor: "transparent",
            color: "rgba(255,255,255,0.80)",
            ...mono,
            fontSize: "12px",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={status === "sending" || !email.trim()}
          style={{
            padding: "10px 16px",
            border: `1px solid ${GOLD}40`,
            backgroundColor: `${GOLD}10`,
            color: `${GOLD}CC`,
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: status === "sending" ? "wait" : "pointer",
            opacity: status === "sending" ? 0.7 : 1,
            flexShrink: 0,
            minHeight: "40px",
          }}
        >
          {status === "sending" ? "Sending..." : "Send"}
        </button>
      </div>

      {status === "error" && (
        <p style={{ marginTop: "8px", fontSize: "12px", color: "rgba(252,165,165,0.55)" }}>
          Could not send. Try again later.
        </p>
      )}

      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.16)", marginTop: "8px" }}>
        No marketing. No subscription. One email only.
      </p>
    </div>
  );
}
