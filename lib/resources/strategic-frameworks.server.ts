/* lib/resources/strategic-frameworks.server.ts — SSOT ALIGNED (SERVER ONLY) */
/**
 * RULES:
 * - This file is SERVER-ONLY. Never import from client components.
 * - Do NOT import Node-only libs into the static module.
 * - Do NOT depend on missing exports (e.g., `requiredTier` from *.static).
 */

import type { Framework } from "./strategic-frameworks.static";
import { getAllFrameworks, getFrameworkBySlug } from "./strategic-frameworks.static";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess, getTierLabel } from "@/lib/access/tier-policy";

// -----------------------------------------------------------------------------
// SERVER-ONLY GUARD (ESM-safe: imports remain at top)
// -----------------------------------------------------------------------------
function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "❌ [strategic-frameworks.server] Server-only module imported in the browser. Fix your imports."
    );
  }
}
assertServerOnly();

// -----------------------------------------------------------------------------
// REQUIRED TIER POLICY (DETERMINISTIC, SSG-SAFE)
// Strategic Frameworks are “above” Surrender.
// Map brand-language labels (Founder/Board/etc.) to enforcement tiers.
// -----------------------------------------------------------------------------
function requiredTierFromFramework(fw: Framework): AccessTier {
  const labels = (Array.isArray(fw?.tier) ? fw.tier : [String(fw?.tier ?? "")])
    .map((x) => String(x ?? "").toLowerCase().trim());

  const set = new Set(labels);

  // strongest wins
  if (set.has("owner")) return "owner";
  if (set.has("architect") || set.has("founder") || set.has("board")) return "architect";
  if (set.has("legacy")) return "legacy";
  if (set.has("client")) return "client";
  if (set.has("inner-circle") || set.has("inner circle")) return "inner-circle";
  if (set.has("member")) return "member";
  return "public";
}

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
export type FrameworkAccessDecision =
  | { ok: true; userTier: AccessTier; requiredTier: AccessTier; requiredLabel: string }
  | {
      ok: false;
      userTier: AccessTier;
      requiredTier: AccessTier;
      requiredLabel: string;
      reason: "requires_auth" | "insufficient_tier";
    };

// -----------------------------------------------------------------------------
// SERVER API
// -----------------------------------------------------------------------------
export async function getServerAllFrameworks(): Promise<Framework[]> {
  // Static SSOT today; later you can merge DB here
  return getAllFrameworks();
}

export async function getServerFrameworkBySlug(slug: string): Promise<Framework | null> {
  const fw = getFrameworkBySlug(slug);
  return fw ?? null;
}

export async function getServerFrameworkRequiredTier(slug: string): Promise<AccessTier | null> {
  const fw = await getServerFrameworkBySlug(slug);
  if (!fw) return null;
  return requiredTierFromFramework(fw);
}

export async function getServerFrameworkAccessDecision(params: {
  slug: string;
  userTier: unknown;
}): Promise<FrameworkAccessDecision | null> {
  const fw = await getServerFrameworkBySlug(params.slug);
  if (!fw) return null;

  const userTier = normalizeUserTier(params.userTier);
  const reqTier = requiredTierFromFramework(fw);
  const requiredLabel = getTierLabel(reqTier);

  // Public is always allowed
  if (reqTier === "public") {
    return { ok: true, userTier, requiredTier: reqTier, requiredLabel };
  }

  // Non-public requires auth
  if (userTier === "public") {
    return {
      ok: false,
      userTier,
      requiredTier: reqTier,
      requiredLabel,
      reason: "requires_auth",
    };
  }

  // Enforce tier access
  if (!hasAccess(userTier, reqTier)) {
    return {
      ok: false,
      userTier,
      requiredTier: reqTier,
      requiredLabel,
      reason: "insufficient_tier",
    };
  }

  return { ok: true, userTier, requiredTier: reqTier, requiredLabel };
}