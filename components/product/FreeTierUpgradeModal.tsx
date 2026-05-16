/**
 * components/product/FreeTierUpgradeModal.tsx
 *
 * Upgrade prompt shown when a free user attempts to create/save
 * a new active governed case beyond the free tier limit.
 *
 * Does not destroy data. Does not block access to prior records.
 * Does not shame the user. Shows continuity upgrade modal.
 */

import * as React from "react";
import Link from "next/link";

import {
  FREE_TIER_MAX_ACTIVE_CASES,
  UPGRADE_MODAL_TITLE,
  UPGRADE_MODAL_BODY,
  PROFESSIONAL_FEATURE_LIST,
  describeTierFeature,
} from "@/lib/product/free-tier-limits";

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
};

export default function FreeTierUpgradeModal({
  onDismiss,
  activeCaseCount,
}: FreeTierUpgradeModalProps) {
  // Track whether the user has acknowledged
  const [acknowledged, setAcknowledged] = React.useState(false);

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
          {UPGRADE_MODAL_TITLE}
        </h2>

        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.55)",
            marginBottom: "20px",
          }}
        >
          You have {activeCaseCount} active case{activeCaseCount !== 1 ? "s" : ""}.{" "}
          {UPGRADE_MODAL_BODY}
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
            Professional unlocks
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
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/pricing"
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0A0A0A",
              backgroundColor: GOLD,
              padding: "12px 24px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Upgrade to Professional
          </Link>

          <button
            type="button"
            onClick={() => {
              setAcknowledged(true);
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
            {acknowledged ? "Dismissed" : "Continue with free tier"}
          </button>
        </div>

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
