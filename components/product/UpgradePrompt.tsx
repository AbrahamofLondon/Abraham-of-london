/**
 * components/product/UpgradePrompt.tsx
 *
 * Inline upgrade prompt for feature-gated surfaces.
 *
 * Renders a compact, consistent locked-state notice when a user encounters
 * a feature they do not have entitlement to access. Uses FeatureDefinition
 * from feature-entitlements.ts — never hardcodes prices or entitlement slugs.
 *
 * Variants:
 * - "inline"   — compact strip, suitable inside cards or sidebars
 * - "full"     — full-width panel, suitable above fold on gated pages
 * - "minimal"  — link + label only, for tight spaces
 *
 * Usage:
 *   <UpgradePrompt feature="executive_reporting" />
 *   <UpgradePrompt feature={featureDefinition} variant="full" />
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { getFeature, type FeatureSlug, type FeatureDefinition } from "@/lib/product/feature-entitlements";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type UpgradePromptVariant = "inline" | "full" | "minimal";

export type UpgradePromptProps = {
  /** Feature slug or resolved FeatureDefinition */
  feature: FeatureSlug | FeatureDefinition;
  /** Display variant. Defaults to "inline". */
  variant?: UpgradePromptVariant;
  /** Optional override label for the CTA button */
  ctaLabel?: string;
  /** Optional override href for the CTA (e.g. to a checkout page with context) */
  ctaHref?: string;
  /** Optional context shown beneath the description */
  context?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveFeature(feature: FeatureSlug | FeatureDefinition): FeatureDefinition {
  if (typeof feature === "string") return getFeature(feature);
  return feature;
}

function accessLevelLabel(level: FeatureDefinition["accessLevel"]): string {
  switch (level) {
    case "free":        return "Free account required";
    case "paid":        return "Paid access required";
    case "retainer":    return "Retained engagement required";
    case "contracted":  return "Contracted access required";
  }
}

// ─── Lock icon (SVG, no external dependency) ─────────────────────────────────

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect x="3" y="7" width="10" height="8" rx="1" stroke={`${GOLD}80`} strokeWidth="1.2" />
      <path
        d="M5 7V5a3 3 0 0 1 6 0v2"
        stroke={`${GOLD}80`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11" r="1" fill={`${GOLD}80`} />
    </svg>
  );
}

// ─── Variants ─────────────────────────────────────────────────────────────────

function MinimalVariant({ f, ctaLabel, ctaHref }: { f: FeatureDefinition; ctaLabel?: string; ctaHref?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <LockIcon size={11} />
      <Link
        href={ctaHref ?? f.upgradeHref}
        style={{
          ...mono,
          fontSize: "9px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: `${GOLD}CC`,
          textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}
      >
        {ctaLabel ?? f.upgradeLabel}
      </Link>
    </span>
  );
}

function InlineVariant({
  f,
  ctaLabel,
  ctaHref,
  context,
}: {
  f: FeatureDefinition;
  ctaLabel?: string;
  ctaHref?: string;
  context?: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${GOLD}20`,
        background: "rgba(201,169,110,0.03)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
      }}
      role="region"
      aria-label={`Upgrade prompt: ${f.displayName}`}
    >
      {/* Left — label + description */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <LockIcon size={14} />
        <div>
          <p
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: `${GOLD}99`,
              marginBottom: "2px",
            }}
          >
            {accessLevelLabel(f.accessLevel)} · {f.displayName}
          </p>
          <p
            style={{
              ...mono,
              fontSize: "9px",
              color: "rgba(255,255,255,0.40)",
              lineHeight: 1.5,
            }}
          >
            {context ?? f.description}
          </p>
        </div>
      </div>

      {/* Right — CTA */}
      <Link
        href={ctaHref ?? f.upgradeHref}
        style={{
          ...mono,
          fontSize: "9px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: GOLD,
          border: `1px solid ${GOLD}40`,
          background: `${GOLD}0A`,
          padding: "8px 14px",
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {ctaLabel ?? f.upgradeLabel}
      </Link>
    </div>
  );
}

function FullVariant({
  f,
  ctaLabel,
  ctaHref,
  context,
}: {
  f: FeatureDefinition;
  ctaLabel?: string;
  ctaHref?: string;
  context?: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${GOLD}25`,
        background: "rgba(201,169,110,0.04)",
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
      role="region"
      aria-label={`Upgrade prompt: ${f.displayName}`}
    >
      {/* Access tier */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <LockIcon size={13} />
        <span
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: `${GOLD}99`,
          }}
        >
          {accessLevelLabel(f.accessLevel)}
        </span>
      </div>

      {/* Feature name */}
      <h3
        style={{
          ...serif,
          fontSize: "22px",
          color: "rgba(255,255,255,0.88)",
          lineHeight: 1.25,
        }}
      >
        {f.displayName}
      </h3>

      {/* Description */}
      <p
        style={{
          ...serif,
          fontSize: "15px",
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.7,
          maxWidth: "520px",
        }}
      >
        {context ?? f.description}
      </p>

      {/* CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
        <Link
          href={ctaHref ?? f.upgradeHref}
          style={{
            ...mono,
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: GOLD,
            border: `1px solid ${GOLD}50`,
            background: `${GOLD}0D`,
            padding: "12px 22px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          {ctaLabel ?? f.upgradeLabel}
        </Link>
      </div>

      {/* Boundary note for contracted / retainer */}
      {(f.accessLevel === "contracted" || f.accessLevel === "retainer") && (
        <p
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.22)",
            lineHeight: 1.6,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "12px",
            marginTop: "4px",
            maxWidth: "520px",
          }}
        >
          This feature is available by direct engagement only. Access is not granted via self-serve checkout.
          Contact us to discuss your requirements.
        </p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UpgradePrompt({
  feature,
  variant = "inline",
  ctaLabel,
  ctaHref,
  context,
}: UpgradePromptProps) {
  const f = resolveFeature(feature);

  if (variant === "minimal") {
    return <MinimalVariant f={f} ctaLabel={ctaLabel} ctaHref={ctaHref} />;
  }
  if (variant === "full") {
    return <FullVariant f={f} ctaLabel={ctaLabel} ctaHref={ctaHref} context={context} />;
  }
  return <InlineVariant f={f} ctaLabel={ctaLabel} ctaHref={ctaHref} context={context} />;
}
