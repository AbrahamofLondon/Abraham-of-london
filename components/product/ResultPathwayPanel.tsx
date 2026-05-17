import * as React from "react";
import Link from "next/link";

import type { ResultPathwayState } from "@/lib/product/result-pathway-state";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

type ResultPathwayPanelProps = {
  state: ResultPathwayState;
  primaryActionNode?: React.ReactNode;
  secondaryActionNodes?: Partial<Record<string, React.ReactNode>>;
};

export default function ResultPathwayPanel({
  state,
  primaryActionNode,
  secondaryActionNodes,
}: ResultPathwayPanelProps) {
  return (
    <section
      style={{
        border: `1px solid ${GOLD}24`,
        backgroundColor: `${GOLD}05`,
        padding: "1.25rem",
      }}
      aria-label="Result pathway"
    >
      <p
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: `${GOLD}88`,
          marginBottom: "0.7rem",
        }}
      >
        Result pathway
      </p>

      <p
        style={{
          ...serif,
          fontSize: "0.98rem",
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.62)",
          marginBottom: "0.7rem",
        }}
      >
        {state.boundaryNote}
      </p>

      <div style={{ display: "grid", gap: "0.45rem", marginBottom: "1rem" }}>
        <PathwayRow label="Record status" value={formatPersistence(state.persistence)} />
        <PathwayRow label="Evidence posture" value={formatEvidence(state.evidenceState)} />
        <PathwayRow label="Commercial state" value={formatCommercialState(state.commercialState)} />
      </div>

      <p
        style={{
          ...mono,
          fontSize: "8px",
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.28)",
          marginBottom: "1rem",
        }}
      >
        {continuityNote(state)}
      </p>

      <div style={{ display: "grid", gap: "10px" }}>
        <div>
          <p style={actionLabelStyle}>One next move</p>
          {primaryActionNode ?? <DefaultAction action={state.primaryAction} primary />}
          <p style={reasonStyle}>{state.primaryAction.reason}</p>
        </div>

        {state.secondaryActions.length > 0 && (
          <div style={{ display: "grid", gap: "8px" }}>
            <p style={actionLabelStyle}>Secondary actions</p>
            {state.secondaryActions.map((action) => (
              <div key={`${action.actionType}:${action.label}`}>
                {secondaryActionNodes?.[action.actionType] ?? <DefaultAction action={action} />}
                {action.reason ? <p style={reasonStyle}>{action.reason}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DefaultAction({
  action,
  primary = false,
}: {
  action: { label: string; href?: string; actionType: string };
  primary?: boolean;
}) {
  if (!action.href) {
    return (
      <span style={actionStyle(primary)}>
        {action.label}
      </span>
    );
  }

  return (
    <Link href={action.href} style={actionStyle(primary)}>
      {action.label}
    </Link>
  );
}

function PathwayRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "baseline", flexWrap: "wrap" }}>
      <span
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.24)",
          minWidth: "110px",
        }}
      >
        {label}
      </span>
      <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.46)" }}>
        {value}
      </span>
    </div>
  );
}

function actionStyle(primary: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    border: primary ? `1px solid ${GOLD}55` : "1px solid rgba(255,255,255,0.10)",
    backgroundColor: primary ? `${GOLD}12` : "rgba(255,255,255,0.02)",
    color: primary ? `${GOLD}DD` : "rgba(255,255,255,0.42)",
    textDecoration: "none",
    padding: primary ? "0.7rem 1.1rem" : "0.55rem 0.9rem",
    ...mono,
    fontSize: primary ? "8px" : "7.5px",
    letterSpacing: primary ? "0.18em" : "0.16em",
    textTransform: "uppercase",
  };
}

const actionLabelStyle: React.CSSProperties = {
  ...mono,
  fontSize: "7px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.24)",
  marginBottom: "0.45rem",
};

const reasonStyle: React.CSSProperties = {
  ...mono,
  fontSize: "7.5px",
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.22)",
  marginTop: "0.4rem",
  maxWidth: "560px",
};

function continuityNote(state: ResultPathwayState): string {
  if (state.userState === "trial" || state.userState === "professional" || state.userState === "enterprise") {
    return "Continuity is available for this governed record: timeline, verification, Return Brief eligibility, and later handoffs can remain intact.";
  }

  return "Professional preserves continuity beyond the free active-case limit. Existing records remain readable even when a new live case cannot yet be kept active.";
}

function formatPersistence(persistence: ResultPathwayState["persistence"]): string {
  switch (persistence) {
    case "session_only":
      return "Session-only reading";
    case "saved_case":
      return "Saved governed case";
    case "account_bound":
      return "Account-bound record";
    case "live_governed_record":
      return "Live governed record";
  }
}

function formatEvidence(evidence: ResultPathwayState["evidenceState"]): string {
  return evidence.replace(/_/g, " ");
}

function formatCommercialState(commercial: ResultPathwayState["commercialState"]): string {
  return commercial.replace(/_/g, " ");
}
