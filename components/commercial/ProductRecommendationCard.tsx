"use client";

import * as React from "react";
import Link from "next/link";
import type { ProductRecommendation } from "@/lib/commercial/recommendation-engine";
import { getCommercialDisplayPrice, isCheckoutAvailable, isContractedProduct } from "@/lib/commercial/catalog";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 400 };

export function ProductRecommendationCard({
  recommendation,
  variant = "default",
}: {
  recommendation: ProductRecommendation;
  variant?: "default" | "dark" | "compact";
}) {
  const { product, reason, urgency, ctaLabel } = recommendation;
  const isDark = variant === "dark" || variant === "compact";
  const price = getCommercialDisplayPrice(product);
  const canCheckout = isCheckoutAvailable(product);
  const isContracted = isContractedProduct(product);
  const isInactive = !product.active;
  const isFree = product.commercialStatus === "free_controlled" || product.amount === 0;

  const borderColor = urgency === "HIGH"
    ? `rgba(201,169,110,0.40)`
    : urgency === "MODERATE"
      ? `rgba(201,169,110,0.25)`
      : `rgba(255,255,255,0.10)`;

  return (
    <div style={{
      borderLeft: `2px solid ${borderColor}`,
      backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#faf7f0",
      padding: variant === "compact" ? "14px 18px" : "18px 22px",
    }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: isDark ? `${GOLD}80` : "#8a6a2f", marginBottom: "6px" }}>
        Recommended next instrument
      </p>

      <p style={{ ...serif, fontSize: variant === "compact" ? "0.95rem" : "1.1rem", lineHeight: 1.4, color: isDark ? "rgba(255,255,255,0.85)" : "#1a1a1a", marginBottom: "6px" }}>
        {product.marketName ?? product.displayName}
      </p>

      <p style={{ fontSize: "12px", lineHeight: 1.6, color: isDark ? "rgba(255,255,255,0.45)" : "#666", marginBottom: "10px" }}>
        {reason}
      </p>

      {product.shortDescription && (
        <p style={{ fontSize: "11px", lineHeight: 1.5, color: isDark ? "rgba(255,255,255,0.30)" : "#999", marginBottom: "8px", fontStyle: "italic" }}>
          {product.shortDescription}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "10px" }}>
        {isFree ? (
          <Link
            href={product.successPath}
            style={{
              padding: "8px 18px",
              backgroundColor: isDark ? "#F5F5F5" : "#1a1a1a",
              color: isDark ? "#0B0B0B" : "#F5F5F5",
              textDecoration: "none",
              ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase",
            }}
          >
            {ctaLabel}
          </Link>
        ) : canCheckout ? (
          <Link
            href={`/checkout?product=${product.code}`}
            style={{
              padding: "8px 18px",
              backgroundColor: GOLD,
              color: "#0B0B0B",
              textDecoration: "none",
              ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase",
            }}
          >
            {ctaLabel} — {price}
          </Link>
        ) : isContracted ? (
          <Link
            href="/retainer"
            style={{
              padding: "8px 18px",
              border: `1px solid ${isDark ? "rgba(201,169,110,0.30)" : "#c9a96e"}`,
              backgroundColor: "transparent",
              color: isDark ? `${GOLD}CC` : "#8a6a2f",
              textDecoration: "none",
              ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase",
            }}
          >
            Request retained oversight
          </Link>
        ) : isInactive ? (
          <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.25)" : "#999" }}>
            Preparing for release — {price}
          </span>
        ) : (
          <Link
            href={product.successPath}
            style={{
              padding: "8px 18px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#ccc"}`,
              backgroundColor: "transparent",
              color: isDark ? "rgba(255,255,255,0.50)" : "#666",
              textDecoration: "none",
              ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase",
            }}
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
