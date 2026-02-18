// types/next-auth.ts — SINGLE SOURCE OF TRUTH for AoL tiering
// Any place that needs tiers should import from here (NOT re-declare unions).

export const AOL_TIERS = [
  "public",
  "free",
  "member",
  "inner-circle",
  "inner-circle-plus",
  "inner-circle-elite",
  "premium",
  "architect",
  "private",
] as const;

export type AoLTier = (typeof AOL_TIERS)[number];

export function isAoLTier(v: unknown): v is AoLTier {
  return typeof v === "string" && (AOL_TIERS as readonly string[]).includes(v);
}

/**
 * Optional: normalize older/legacy tier names into current tier set.
 * Keep this conservative: only normalize what you truly used historically.
 */
export function normalizeAoLTier(v: unknown): AoLTier {
  if (isAoLTier(v)) return v;

  const s = String(v ?? "").toLowerCase().trim();

  // legacy aliases
  if (s === "inner" || s === "innercircle" || s === "inner_circle") return "inner-circle";
  if (s === "elite") return "inner-circle-elite";
  if (s === "plus") return "inner-circle-plus";

  return "public";
}