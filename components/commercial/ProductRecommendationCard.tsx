"use client";

import * as React from "react";
import Link from "next/link";
import type { EarnedProgression } from "@/lib/commercial/recommendation-engine";
import { getCommercialDisplayPrice, isCheckoutAvailable, isContractedProduct } from "@/lib/commercial/catalog";
import { trackLaunch } from "@/lib/analytics/client-launch-events";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 400 };

/**
 * ProductAdmissionCard — shows an earned next step, not a sales pitch.
 *
 * The card must explain: why this became available, what it will test,
 * and what happens if the user stops here.
 *
 * Exported as both ProductAdmissionCard and ProductRecommendationCard
 * for backward compatibility.
 */
export function ProductAdmissionCard({
  progression,
  variant = "default",
}: {
  progression: EarnedProgression;
  variant?: "default" | "dark" | "compact";
}) {
  const { product, state, reason, evidenceThreshold, whatItWillTest, whatHappensIfYouStop, ctaLabel } = progression;
  const isDark = variant === "dark" || variant === "compact";
  const price = getCommercialDisplayPrice(product);
  const canCheckout = isCheckoutAvailable(product);
  const isContracted = isContractedProduct(product);
  const isInactive = !product.active;
  const isFree = product.commercialStatus === "free_controlled" || product.amount === 0;

  React.useEffect(() => {
    trackLaunch("earned_step_shown", "earned_progression", { productCode: product.code, admissionState: state });
  }, [product.code, state]);

  const onEarnedStepClicked = () => {
    trackLaunch("earned_step_clicked", "earned_progression", { productCode: product.code, admissionState: state });
  };

  const textPrimary = isDark ? "rgba(255,255,255,0.85)" : "#1a1a1a";
  const textSecondary = isDark ? "rgba(255,255,255,0.50)" : "#666";
  const textMuted = isDark ? "rgba(255,255,255,0.25)" : "#999";
  const borderColor = isDark ? "rgba(201,169,110,0.25)" : "#e5e0d5";
  const bg = isDark ? "rgba(255,255,255,0.02)" : "#faf7f0";

  return (
    <div style={{ borderLeft: `2px solid ${borderColor}`, backgroundColor: bg, padding: variant === "compact" ? "14px 18px" : "18px 22px" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: isDark ? `${GOLD}80` : "#8a6a2f", marginBottom: "6px" }}>
        {state === "EARNED_ACCESS" ? "Earned next step"
          : state === "RECOMMENDED_BY_EVIDENCE" ? "Available based on your evidence"
          : state === "AVAILABLE_BUT_NOT_WARRANTED" ? "Available — not yet released"
          : "Next instrument"}
      </p>

      <p style={{ ...serif, fontSize: variant === "compact" ? "0.95rem" : "1.1rem", lineHeight: 1.4, color: textPrimary, marginBottom: "8px" }}>
        {product.marketName ?? product.displayName}
      </p>

      <p style={{ fontSize: "12px", lineHeight: 1.6, color: textSecondary, marginBottom: "8px" }}>
        {reason}
      </p>

      {evidenceThreshold.length > 0 && (
        <div style={{ marginBottom: "8px" }}>
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: textMuted, marginBottom: "4px" }}>
            Evidence threshold met because:
          </p>
          {evidenceThreshold.map((t, i) => (
            <p key={i} style={{ fontSize: "11px", lineHeight: 1.5, color: textSecondary, paddingLeft: "10px" }}>
              &bull; {t}
            </p>
          ))}
        </div>
      )}

      <p style={{ fontSize: "11px", lineHeight: 1.5, color: textMuted, fontStyle: "italic", marginBottom: "8px" }}>
        What it will test: {whatItWillTest}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "10px" }}>
        {isFree ? (
          <Link href={product.successPath} onClick={onEarnedStepClicked} style={{ padding: "8px 18px", backgroundColor: isDark ? "#F5F5F5" : "#1a1a1a", color: isDark ? "#0B0B0B" : "#F5F5F5", textDecoration: "none", ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase" }}>
            {ctaLabel}
          </Link>
        ) : canCheckout && state === "EARNED_ACCESS" ? (
          <Link href={`/checkout?product=${product.code}`} onClick={onEarnedStepClicked} style={{ padding: "8px 18px", backgroundColor: GOLD, color: "#0B0B0B", textDecoration: "none", ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase" }}>
            {ctaLabel} — {price}
          </Link>
        ) : isContracted ? (
          <Link href="/retainer" style={{ padding: "8px 18px", border: `1px solid ${isDark ? "rgba(201,169,110,0.30)" : "#c9a96e"}`, backgroundColor: "transparent", color: isDark ? `${GOLD}CC` : "#8a6a2f", textDecoration: "none", ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase" }}>
            Request retained oversight
          </Link>
        ) : isInactive ? (
          <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase", color: textMuted }}>
            Not yet available — {price}
          </span>
        ) : null}
      </div>

      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: textMuted, marginTop: "10px" }}>
        {whatHappensIfYouStop}
      </p>
    </div>
  );
}

// Backward compatibility alias
export function ProductRecommendationCard({
  recommendation,
  variant = "default",
}: {
  recommendation: EarnedProgression;
  variant?: "default" | "dark" | "compact";
}) {
  return <ProductAdmissionCard progression={recommendation} variant={variant} />;
}
