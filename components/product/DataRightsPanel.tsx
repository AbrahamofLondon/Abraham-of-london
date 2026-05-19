/**
 * components/product/DataRightsPanel.tsx
 *
 * Data rights panel — surfaces GDPR/CCPA rights to authenticated users.
 *
 * Shown in Decision Centre account settings and the Trust Centre for
 * authenticated users. Provides direct access to data export and
 * links to deletion documentation.
 *
 * Rights surfaced:
 * - Right to export (GET /api/user/data-export)
 * - Right to deletion (DELETE /api/cases/[caseId] per-case; email for full erasure)
 * - Right to rectification (link to DC for case edits)
 * - Contact for DPA / restriction requests
 */

"use client";

import * as React from "react";
import Link from "next/link";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RightRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "14px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1 }}>
        <p
          style={{
            ...mono,
            fontSize: "9px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.60)",
            marginBottom: "4px",
          }}
        >
          {title}
        </p>
        <p
          style={{
            ...serif,
            fontSize: "13px",
            color: "rgba(255,255,255,0.42)",
            lineHeight: 1.6,
            maxWidth: "400px",
          }}
        >
          {description}
        </p>
      </div>
      <div style={{ flexShrink: 0 }}>{action}</div>
    </div>
  );
}

// ─── Export trigger ───────────────────────────────────────────────────────────

function ExportButton() {
  const [state, setState] = React.useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleExport() {
    setState("loading");
    try {
      const res = await fetch("/api/user/data-export", { method: "GET" });
      if (!res.ok) {
        setState("error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `aol-data-export-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setState("done");
      setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  const labels: Record<typeof state, string> = {
    idle:    "Export my data",
    loading: "Preparing…",
    done:    "Downloaded",
    error:   "Export failed — retry",
  };

  return (
    <button
      type="button"
      onClick={() => { void handleExport(); }}
      disabled={state === "loading"}
      style={{
        ...mono,
        fontSize: "8px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: state === "done"
          ? "rgba(100,220,140,0.90)"
          : state === "error"
          ? "rgba(255,100,100,0.80)"
          : `${GOLD}CC`,
        border: `1px solid ${
          state === "done" ? "rgba(100,220,140,0.30)" :
          state === "error" ? "rgba(255,100,100,0.30)" :
          `${GOLD}40`
        }`,
        background: "rgba(255,255,255,0.02)",
        padding: "8px 14px",
        cursor: state === "loading" ? "wait" : "pointer",
      }}
    >
      {labels[state]}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DataRightsPanel() {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.015)",
        padding: "20px 24px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <p
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: `${GOLD}90`,
            marginBottom: "6px",
          }}
        >
          Your data rights
        </p>
        <p
          style={{
            ...serif,
            fontSize: "13px",
            color: "rgba(255,255,255,0.38)",
            lineHeight: 1.6,
            maxWidth: "440px",
          }}
        >
          UK GDPR and CCPA rights. Actions below apply to your governed case
          records. For a full data disclosure or to request erasure of all
          records, contact support@abrahamoflondon.org.
        </p>
      </div>

      {/* Rights rows */}
      <RightRow
        title="Right to export"
        description="Download all your governed case data in structured JSON format. Excludes raw internal fields."
        action={<ExportButton />}
      />

      <RightRow
        title="Right to deletion"
        description="Delete individual cases from Decision Centre. Identity is separated immediately; case data removed after 30 days."
        action={
          <Link
            href="/decision-centre"
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.02)",
              padding: "8px 14px",
              display: "inline-block",
            }}
          >
            Go to Decision Centre
          </Link>
        }
      />

      <RightRow
        title="Right to rectification"
        description="Correct case metadata through Decision Centre. Assessment findings are immutable by design."
        action={
          <Link
            href="/decision-centre"
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.02)",
              padding: "8px 14px",
              display: "inline-block",
            }}
          >
            Manage cases
          </Link>
        }
      />

      <RightRow
        title="Full erasure / DPA"
        description="Request erasure of all records including entitlement and billing history, or request a Data Processing Agreement."
        action={
          <a
            href="mailto:support@abrahamoflondon.org?subject=Data%20Rights%20Request"
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.02)",
              padding: "8px 14px",
              display: "inline-block",
            }}
          >
            Email privacy team
          </a>
        }
      />

      {/* Footer */}
      <p
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.10em",
          color: "rgba(255,255,255,0.18)",
          lineHeight: 1.75,
          marginTop: "16px",
          paddingTop: "14px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        Requests are processed within 30 days. For questions about how your data is used,
        see the{" "}
        <Link href="/trust" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "underline" }}>
          Trust Centre
        </Link>
        {" "}and{" "}
        <Link href="/privacy-policy" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "underline" }}>
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
