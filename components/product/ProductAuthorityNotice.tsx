/**
 * components/product/ProductAuthorityNotice.tsx
 *
 * Authority Notice Component
 *
 * Displays notices about authority limitations, blocking reasons, and actions needed.
 * Only displays when authority is limited or blocked.
 *
 * Usage:
 *   <ProductAuthorityNotice contract={contract} />
 */

import React from "react";
import { ProductAuthorityContract } from "@/lib/product/product-authority-contract";

interface ProductAuthorityNoticeProps {
  contract: ProductAuthorityContract;
}

/**
 * Get notice type and styling
 */
function getNoticeStyle(
  state: string
): {
  type: "error" | "warning" | "info";
  title: string;
  icon: string;
} {
  if (state.includes("blocked")) {
    return {
      type: "error",
      title: "Authority Blocked",
      icon: "🚫",
    };
  } else if (state === "legacy_validated_pending_v2_revalidation") {
    return {
      type: "warning",
      title: "Legacy Authority",
      icon: "⚠️",
    };
  } else if (state === "measurement_inconclusive") {
    return {
      type: "warning",
      title: "Authority Inconclusive",
      icon: "❓",
    };
  } else if (state.includes("internal")) {
    return {
      type: "info",
      title: "Internal Use Only",
      icon: "ℹ️",
    };
  } else {
    return {
      type: "info",
      title: "Authority Status",
      icon: "ℹ️",
    };
  }
}

/**
 * Get styling colors by notice type
 */
function getStyleColors(type: "error" | "warning" | "info"): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  buttonColor: string;
} {
  switch (type) {
    case "error":
      return {
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
        textColor: "#7f1d1d",
        buttonColor: "#ef4444",
      };
    case "warning":
      return {
        backgroundColor: "#fffbeb",
        borderColor: "#fcd34d",
        textColor: "#78350f",
        buttonColor: "#f59e0b",
      };
    case "info":
      return {
        backgroundColor: "#eff6ff",
        borderColor: "#bfdbfe",
        textColor: "#0c2340",
        buttonColor: "#3b82f6",
      };
  }
}

export function ProductAuthorityNotice({
  contract,
}: ProductAuthorityNoticeProps) {
  const notice = getNoticeStyle(contract.currentAuthorityState);
  const colors = getStyleColors(notice.type);

  // Only show notice if there are blocking reasons or authority is limited
  if (
    contract.blockingReasons.length === 0 &&
    contract.currentAuthorityState === "externally_proven_gold_product"
  ) {
    return null;
  }

  return (
    <div
      style={{
        border: `1px solid ${colors.borderColor}`,
        borderRadius: "6px",
        padding: "12px 14px",
        backgroundColor: colors.backgroundColor,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}
      >
        <span style={{ fontSize: "18px", flexShrink: 0 }}>
          {notice.icon}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: colors.textColor,
              marginBottom: "4px",
            }}
          >
            {notice.title}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: colors.textColor,
              lineHeight: "1.5",
              marginBottom:
                contract.blockingReasons.length > 0 ? "8px" : undefined,
            }}
          >
            {contract.currentAuthorityState === "externally_proven_gold_product"
              ? "This product has been validated and has authority to make its claims."
              : contract.currentAuthorityState ===
                  "legacy_validated_pending_v2_revalidation"
                ? "This product has legacy authority but requires v2 revalidation for continued claims."
                : contract.currentAuthorityState.includes("blocked")
                  ? "This product does not currently have authority to make diagnostic or intelligence claims."
                  : contract.currentAuthorityState === "measurement_inconclusive"
                    ? "Authority validation detected measurement boundary violations."
                    : "Authority status is limited. See details below."}
          </div>

          {contract.blockingReasons.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: colors.textColor,
                  marginBottom: "4px",
                }}
              >
                Blocking Reasons:
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "20px",
                  fontSize: "12px",
                  color: colors.textColor,
                }}
              >
                {contract.blockingReasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div
            style={{
              fontSize: "12px",
              fontWeight: "500",
              color: colors.textColor,
              fontStyle: "italic",
            }}
          >
            Next: {contract.nextEvidenceAction}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductAuthorityNotice;
