/**
 * components/product/ProductAuthorityBadge.tsx
 *
 * Authority Badge Component
 *
 * Displays product authority state as a visual badge.
 * Consumes ProductAuthorityContract; does not accept arbitrary authority strings.
 *
 * Usage:
 *   <ProductAuthorityBadge productCode="fast_diagnostic" />
 *
 * Renders nothing if contract data is unavailable.
 */

import React from "react";
import { ProductAuthorityState } from "@/lib/product/product-authority-contract";

interface ProductAuthorityBadgeProps {
  productCode: string;
  currentAuthorityState: ProductAuthorityState;
  size?: "small" | "medium" | "large";
  variant?: "default" | "compact";
}

/**
 * Get badge styling based on authority state
 */
function getBadgeStyle(state: ProductAuthorityState): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
} {
  switch (state) {
    case "externally_proven_gold_product":
      return {
        backgroundColor: "#10b981",
        textColor: "#ffffff",
        borderColor: "#059669",
      };
    case "diagnostic_product":
    case "judgement_product":
      return {
        backgroundColor: "#3b82f6",
        textColor: "#ffffff",
        borderColor: "#1d4ed8",
      };
    case "legacy_validated_pending_v2_revalidation":
      return {
        backgroundColor: "#f59e0b",
        textColor: "#ffffff",
        borderColor: "#d97706",
      };
    case "blocked_until_claim_evidenced":
    case "blocked_until_v2_revalidation":
      return {
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
        borderColor: "#dc2626",
      };
    case "measurement_inconclusive":
      return {
        backgroundColor: "#8b5cf6",
        textColor: "#ffffff",
        borderColor: "#7c3aed",
      };
    case "static_reference":
    case "internal_only":
    case "authority_contract_missing":
      return {
        backgroundColor: "#6b7280",
        textColor: "#ffffff",
        borderColor: "#4b5563",
      };
  }
}

/**
 * Get badge label text from authority state
 */
function getBadgeLabel(state: ProductAuthorityState): string {
  switch (state) {
    case "externally_proven_gold_product":
      return "Externally Proven";
    case "diagnostic_product":
      return "Diagnostic";
    case "judgement_product":
      return "Judgement";
    case "legacy_validated_pending_v2_revalidation":
      return "Legacy Pending v2";
    case "blocked_until_claim_evidenced":
      return "Blocked";
    case "blocked_until_v2_revalidation":
      return "Blocked";
    case "measurement_inconclusive":
      return "Inconclusive";
    case "static_reference":
      return "Reference";
    case "internal_only":
      return "Internal";
    case "authority_contract_missing":
      return "Contract Missing";
  }
}

export function ProductAuthorityBadge({
  productCode,
  currentAuthorityState,
  size = "medium",
  variant = "default",
}: ProductAuthorityBadgeProps) {
  const style = getBadgeStyle(currentAuthorityState);
  const label = getBadgeLabel(currentAuthorityState);

  const sizeClasses = {
    small: "px-2 py-1 text-xs font-semibold rounded",
    medium: "px-3 py-1.5 text-sm font-semibold rounded",
    large: "px-4 py-2 text-base font-semibold rounded-lg",
  };

  return (
    <span
      style={{
        backgroundColor: style.backgroundColor,
        color: style.textColor,
        border: `1px solid ${style.borderColor}`,
      }}
      className={sizeClasses[size]}
      title={`${productCode}: ${currentAuthorityState}`}
    >
      {variant === "compact" ? label.split(" ")[0] : label}
    </span>
  );
}

export default ProductAuthorityBadge;
