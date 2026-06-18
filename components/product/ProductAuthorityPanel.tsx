/**
 * components/product/ProductAuthorityPanel.tsx
 *
 * Authority Panel Component
 *
 * Displays complete authority state, evidence source, and claim permissions.
 * Consumed from ProductAuthorityContract; never hardcoded.
 *
 * Usage:
 *   <ProductAuthorityPanel contract={contract} />
 */

import React from "react";
import { ProductAuthorityContract } from "@/lib/product/product-authority-contract";

interface ProductAuthorityPanelProps {
  contract: ProductAuthorityContract;
  expanded?: boolean;
}

export function ProductAuthorityPanel({
  contract,
  expanded = false,
}: ProductAuthorityPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(expanded);

  const canMakePublicClaims = contract.publicClaimAllowed;
  const evidenceSourceLabel = {
    generated_evidence: "Generated Evidence (Deterministic)",
    legacy_evidence: "Legacy Evidence (v1)",
    structured_external_evidence: "Structured External Evidence",
    explicit_missing_evidence: "Explicit Missing-Evidence Record",
    explicit_blocked_evidence: "Explicit Blocked-Evidence Record",
    reported_summary_only: "Report Summary",
    manual_assertion: "Manual Assertion",
    registry_label: "Registry Label",
    surface_claim: "Surface Copy",
  }[contract.evidenceSource.sourceType] || contract.evidenceSource.sourceType;

  return (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#f9fafb",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          cursor: "pointer",
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          Authority Status
        </h3>
        <span
          style={{
            fontSize: "12px",
            color: "#6b7280",
            fontWeight: "500",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {isExpanded ? "Hide" : "Show"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              fontWeight: "500",
              marginBottom: "4px",
            }}
          >
            STATE
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#1f2937",
              fontFamily: "monospace",
            }}
          >
            {contract.currentAuthorityState}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              fontWeight: "500",
              marginBottom: "4px",
            }}
          >
            EVIDENCE SOURCE
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#1f2937",
            }}
          >
            {evidenceSourceLabel}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "8px 12px",
          backgroundColor:
            canMakePublicClaims
              ? "#d1fae5"
              : "#fee2e2",
          borderLeft:
            canMakePublicClaims
              ? "4px solid #10b981"
              : "4px solid #ef4444",
          borderRadius: "4px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            color:
              canMakePublicClaims
                ? "#065f46"
                : "#7f1d1d",
            lineHeight: "1.5",
          }}
        >
          <strong>Public Claim:</strong> {contract.publicClaimLanguage}
        </div>
      </div>

      {isExpanded && (
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                fontWeight: "500",
                marginBottom: "4px",
              }}
            >
              TARGET CLAIM
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#374151",
              }}
            >
              {contract.targetClaim}
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                fontWeight: "500",
                marginBottom: "4px",
              }}
            >
              EVIDENCE-SUPPORTED CLAIM
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#374151",
              }}
            >
              {contract.evidenceSupportedClaim}
            </div>
          </div>

          {contract.blockingReasons.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  fontWeight: "500",
                  marginBottom: "4px",
                }}
              >
                BLOCKING REASONS
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "20px",
                  color: "#374151",
                  fontSize: "13px",
                }}
              >
                {contract.blockingReasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                fontWeight: "500",
                marginBottom: "4px",
              }}
            >
              NEXT EVIDENCE ACTION
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#374151",
                fontStyle: "italic",
              }}
            >
              {contract.nextEvidenceAction}
            </div>
          </div>

          {contract.evidenceSource.canonicalLocation && (
            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  fontWeight: "500",
                  marginBottom: "4px",
                }}
              >
                CANONICAL EVIDENCE LOCATION
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#0284c7",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                }}
              >
                {contract.evidenceSource.canonicalLocation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductAuthorityPanel;
