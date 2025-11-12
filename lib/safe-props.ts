// lib/safe-props.ts
// =============================================================================
// SAFE PROPERTY COERCION HELPERS (Production-Ready)
// =============================================================================

import type { EventResources, LinkItem } from "@/types/event";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Common cover aspect ratios supported by cards, events, and downloads */
export type CoverAspect = "book" | "wide" | "square";

/** How images should be resized within their frame */
export type CoverFit = "contain" | "cover";

/** Strict union used by cards to prevent layout distortion */
export type CardCoverPosition = "center" | "left" | "right" | undefined;

// =============================================================================
// GENERIC SAFE HELPERS
// =============================================================================

/**
 * Ensure an array, returning an empty default if not.
 * Preserves type safety for `T`.
 */
export function safeArray<T>(value: unknown, defaultValue: readonly T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : [...defaultValue];
}

/**
 * Safely cast to string, or fallback.
 */
export function safeString(value: unknown, defaultValue = ""): string {
  return typeof value === "string" ? value : defaultValue;
}

/**
 * Convert null → undefined for React component props.
 * (Avoids `null` props being serialized to HTML attributes.)
 */
export function safePostProp<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

// =============================================================================
// EVENT RESOURCE HELPERS
// =============================================================================

/**
 * Coerce dynamic event resource data into a normalized structure.
 */
export function safeEventResources(resources: unknown): EventResources | null {
  if (!resources || typeof resources !== "object") return null;
  const res = resources as Record<string, unknown>;
  return {
    downloads: safeArray<LinkItem>(res.downloads),
    reads: safeArray<LinkItem>(res.reads),
  };
}

// =============================================================================
// IMAGE & COVER HELPERS
// =============================================================================

/**
 * Normalizes image aspect string to a safe union.
 */
export function safeCoverAspect(value: string | null | undefined): CoverAspect {
  const v = (value ?? "").toLowerCase();
  return v === "wide" || v === "square" || v === "book" ? (v as CoverAspect) : "book";
}

/**
 * Determine the most appropriate fit based on aspect or explicit value.
 */
export function safeCoverFit(
  value: string | null | undefined,
  aspect?: string | null | undefined,
): CoverFit {
  const a = (aspect || "book").toLowerCase();
  const v = (value || (a === "book" ? "contain" : "cover")).toLowerCase();
  return v === "contain" || v === "cover"
    ? (v as CoverFit)
    : a === "book"
      ? "contain"
      : "cover";
}

/**
 * Normalize alignment keywords to a strict card-safe union.
 */
export function safeCardCoverPosition(
  value: string | null | undefined,
): "center" | "left" | "right" | undefined {
  const v = typeof value === "string" ? value.toLowerCase() : "";
  if (v === "left" || v === "right" || v === "center") return v;
  if (!v) return undefined;
  if (v.includes("left")) return "left";
  if (v.includes("right")) return "right";
  if (v.includes("center") || v.includes("middle")) return "center";
  return undefined;
}

/** Backward compatibility alias */
export const safeCoverPosition = safeCardCoverPosition;

// =============================================================================
// VALUE NORMALIZATION HELPERS
// =============================================================================

/**
 * Safe boolean coercion with predictable fallback.
 */
export function safeBoolean(value: unknown, defaultValue = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (["true", "1", "yes", "y", "on"].includes(lower)) return true;
    if (["false", "0", "no", "n", "off"].includes(lower)) return false;
  }
  if (typeof value === "number") return value !== 0;
  return defaultValue;
}

/**
 * Safe number coercion; avoids NaN propagation.
 */
export function safeNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
}

/**
 * Convert arbitrary values to string for logging, display, or keys.
 */
export function safeStringValue(value: unknown, defaultValue = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return defaultValue;
  try {
    return String(value);
  } catch {
    return defaultValue;
  }
}

// =============================================================================
// COMBINED EXPORT
// =============================================================================

export default {
  safeArray,
  safeString,
  safeStringValue,
  safeNumber,
  safeBoolean,
  safeCoverAspect,
  safeCoverFit,
  safeCardCoverPosition,
  safeCoverPosition,
  safePostProp,
  safeEventResources,
};