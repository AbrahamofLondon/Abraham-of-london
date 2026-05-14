import * as React from "react";
import { ShieldCheck, ShieldAlert, Shield, Clock, AlertTriangle, Copy, Check } from "lucide-react";

import { metadataLabelStyle } from "@/lib/design/typography";
import {
  buildProvenanceBadgeModel,
  type ProvenanceBadgeInput,
  type ProvenanceBadgeModel,
  type ProvenanceBadgeState,
} from "@/lib/product/client-safe-provenance-badge";
import type { ClientSafeProvenanceSummary } from "@/lib/product/client-safe-provenance-contract";

// ─── Design tokens ─────────────────────────────────────────────────────────────

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };
const GOLD = "#C9A96E";
const EMERALD = "#6EE7B7";
const ROSE = "#FB7185";
const AMBER = "#F59E0B";

// ─── State config ──────────────────────────────────────────────────────────────

type StateConfig = {
  color: string;
  borderColor: string;
  bgColor: string;
  icon: React.ReactNode;
};

function stateConfig(state: ProvenanceBadgeState): StateConfig {
  const iconSize = { width: 10, height: 10 };
  switch (state) {
    case "CHAIN_ANCHORED":
      return {
        color: EMERALD,
        borderColor: "rgba(110,231,183,0.20)",
        bgColor: "rgba(110,231,183,0.06)",
        icon: <ShieldCheck style={{ ...iconSize, color: EMERALD }} />,
      };
    case "HASH_VERIFIED":
      return {
        color: GOLD,
        borderColor: "rgba(201,169,110,0.20)",
        bgColor: "rgba(201,169,110,0.06)",
        icon: <ShieldCheck style={{ ...iconSize, color: GOLD }} />,
      };
    case "PENDING_ANCHOR":
      return {
        color: AMBER,
        borderColor: "rgba(245,158,11,0.20)",
        bgColor: "rgba(245,158,11,0.05)",
        icon: <Clock style={{ ...iconSize, color: AMBER }} />,
      };
    case "NOT_ANCHORED":
      return {
        color: "rgba(255,255,255,0.28)",
        borderColor: "rgba(255,255,255,0.08)",
        bgColor: "rgba(255,255,255,0.03)",
        icon: <Shield style={{ ...iconSize, color: "rgba(255,255,255,0.28)" }} />,
      };
    case "INTEGRITY_WARNING":
      return {
        color: ROSE,
        borderColor: "rgba(251,113,133,0.25)",
        bgColor: "rgba(251,113,133,0.07)",
        icon: <AlertTriangle style={{ ...iconSize, color: ROSE }} />,
      };
  }
}

// ─── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ value, color }: { value: string; color: string }) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => { /* clipboard unavailable */ });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy full hash"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0 2px",
        color: copied ? EMERALD : color,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {copied
        ? <Check style={{ width: 9, height: 9 }} />
        : <Copy style={{ width: 9, height: 9 }} />}
    </button>
  );
}

// ─── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ model, config }: { model: ProvenanceBadgeModel; config: StateConfig }) {
  const row = (label: string, value: string | null, dim = false) =>
    value ? (
      <div style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", minWidth: "100px" }}>
          {label}
        </span>
        <span style={{ ...mono, fontSize: "8px", color: dim ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.68)" }}>
          {value}
        </span>
      </div>
    ) : null;

  return (
    <div
      style={{
        border: `1px solid ${config.borderColor}`,
        background: "rgba(0,0,0,0.55)",
        padding: "14px 16px",
        marginTop: "6px",
        backdropFilter: "blur(4px)",
        minWidth: "280px",
        maxWidth: "380px",
      }}
    >
      {/* Hash */}
      {model.provenanceHashFull && model.provenanceHashShort && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.25)", marginBottom: "4px" }}>
            Provenance hash
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{ ...mono, fontSize: "9px", letterSpacing: "0.10em", color: config.color }}
              title={model.provenanceHashFull}
            >
              {model.provenanceHashShort}
            </span>
            <CopyButton value={model.provenanceHashFull} color={config.color} />
          </div>
        </div>
      )}

      {/* Accountability statement */}
      {model.accountabilityStatement && (
        <p style={{ ...serif, fontSize: "0.78rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.6, marginBottom: "12px" }}>
          {model.accountabilityStatement}
        </p>
      )}

      {/* Posture rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "12px" }}>
        {row("Delivery", model.deliveryPostureLabel)}
        {row("Outcome", model.outcomePostureLabel)}
        {row("Anchor", model.anchorStatusLabel)}
        {row("Chain", model.chainStatusLabel)}
        {row("External anchor", model.externalAnchoringLabel, true)}
      </div>

      {/* Confidence bands */}
      {model.confidenceBands.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ ...metadataLabelStyle, color: "rgba(255,255,255,0.22)", marginBottom: "5px" }}>
            Evidence confidence
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {model.confidenceBands.map((band) => (
              <div
                key={band.level}
                style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "2px 7px" }}
              >
                <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: `${GOLD}88` }}>
                  {band.label}
                </span>
                <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.35)", marginLeft: "5px" }}>
                  {band.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Limitation note */}
      <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.18)", lineHeight: 1.65 }}>
        {model.limitationNote}
      </p>
    </div>
  );
}

// ─── ProvenanceBadge ───────────────────────────────────────────────────────────

type ProvenanceBadgeProps = {
  summary: ClientSafeProvenanceSummary | null;
  anchorStatus?: ProvenanceBadgeInput["anchorStatus"];
  externalAnchoringConfigured?: boolean;
};

export default function ProvenanceBadge({
  summary,
  anchorStatus,
  externalAnchoringConfigured = false,
}: ProvenanceBadgeProps) {
  const [open, setOpen] = React.useState(false);
  const model = buildProvenanceBadgeModel({ summary, anchorStatus, externalAnchoringConfigured });
  const config = stateConfig(model.state);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          border: `1px solid ${config.borderColor}`,
          background: config.bgColor,
          padding: "3px 8px",
          cursor: "pointer",
        }}
        title={`Provenance: ${model.label}`}
      >
        {config.icon}
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: config.color }}>
          {model.label}
        </span>
        <ShieldAlert
          style={{ width: 7, height: 7, color: "rgba(255,255,255,0.20)", marginLeft: "2px" }}
          aria-hidden
        />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, marginTop: "2px" }}>
          <DetailPanel model={model} config={config} />
        </div>
      )}
    </div>
  );
}

export { buildProvenanceBadgeModel };
export type { ProvenanceBadgeModel, ProvenanceBadgeState };
