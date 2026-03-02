/* ============================================================================
 * SOVEREIGN INTELLIGENCE REGISTRY — ENTERPRISE SSOT (V1.1.0)
 * ----------------------------------------------------------------------------
 * - requiredTier: SSOT enforcement tier (AccessTier)
 * - classificationLabel: UI-only classification label (optional)
 * - Single normalization path (no duplicated tier maps)
 * - No runtime require(); fully tree-shakeable + TS-safe
 * ============================================================================ */

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeRequiredTier,
  normalizeUserTier,
  hasAccess,
  getTierLabel,
} from "@/lib/access/tier-policy";

/**
 * UI-only labels (NOT used for access control)
 */
export type ClassificationLabel = "Public" | "Private" | "Restricted" | "Confidential" | "Top Secret";

/**
 * Canonical brief record for gating + UI
 */
export interface BriefEntry {
  id: string;
  volume: number;
  title: string;
  series: string;
  abstract: string;

  /**
   * SSOT enforcement tier — THIS is what gates access.
   */
  requiredTier: AccessTier;

  /**
   * Optional UI label. Do not gate on this.
   */
  classificationLabel?: ClassificationLabel;

  readingTime: string;
  tags: string[];
  publishedAt: string; // ISO date string
}

/**
 * Enterprise normalizer:
 * - Accepts legacy labels ("Restricted", "private", "premium", "founder", etc.)
 * - Returns SSOT tier.
 * - Unknown -> public (never lock content by accident).
 *
 * If you want unknown -> member (stricter), change DEFAULT_UNKNOWN.
 */
const DEFAULT_UNKNOWN: AccessTier = "public";

export function toRequiredTier(input: unknown): AccessTier {
  const raw = String(input ?? "").trim();
  if (!raw) return DEFAULT_UNKNOWN;

  // Normalize legacy classification labels (UI vocabulary)
  const k = raw.toLowerCase().replace(/\s+/g, "_");

  const legacyClassification: Record<string, AccessTier> = {
    public: "public",
    private: "client",
    restricted: "client",
    confidential: "architect",
    top_secret: "owner",
    topsecret: "owner",
  };

  if (legacyClassification[k]) return legacyClassification[k];

  // Fall back to SSOT alias policy (tier-policy.ts owns this map)
  return normalizeRequiredTier(raw);
}

/**
 * Standard access decision object (reused across UI/API)
 */
export type BriefAccessDecision =
  | { ok: true; userTier: AccessTier; requiredTier: AccessTier; requiredLabel: string }
  | {
      ok: false;
      userTier: AccessTier;
      requiredTier: AccessTier;
      requiredLabel: string;
      reason: "requires_auth" | "insufficient_tier";
    };

export function getBriefAccessDecision(brief: BriefEntry, userTierInput?: unknown): BriefAccessDecision {
  const userTier = normalizeUserTier(userTierInput ?? "public");
  const requiredTier = brief.requiredTier;
  const requiredLabel = getTierLabel(requiredTier);

  if (requiredTier === "public") return { ok: true, userTier, requiredTier, requiredLabel };
  if (userTier === "public") return { ok: false, userTier, requiredTier, requiredLabel, reason: "requires_auth" };
  if (!hasAccess(userTier, requiredTier)) {
    return { ok: false, userTier, requiredTier, requiredLabel, reason: "insufficient_tier" };
  }
  return { ok: true, userTier, requiredTier, requiredLabel };
}

/**
 * Registry (expand to all briefs)
 */
export const BRIEF_REGISTRY: BriefEntry[] = [
  {
    id: "v1-resilience",
    volume: 1,
    title: "The Resilience Framework",
    series: "Institutional Design",
    abstract: "A fundamental re-evaluation of institutional stability within frontier markets.",

    // Enforcement (SSOT)
    requiredTier: toRequiredTier("Restricted"), // -> client

    // UI label (optional)
    classificationLabel: "Restricted",

    readingTime: "12 min",
    tags: ["Governance", "Stability", "Directorate"],
    publishedAt: "2026-01-15",
  },
];

/**
 * Fetch helpers
 */
export function getBriefById(id: string): BriefEntry | undefined {
  const target = String(id || "").trim();
  if (!target) return undefined;
  return BRIEF_REGISTRY.find((b) => b.id === target);
}

export function getBriefClassificationLabel(brief: BriefEntry): string {
  // Prefer explicit UI label if present, else use SSOT label
  if (brief.classificationLabel) return brief.classificationLabel;
  return getTierLabel(brief.requiredTier);
}