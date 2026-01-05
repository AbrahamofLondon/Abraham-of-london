// lib/access/logic.ts
// Centralised access-control logic for AoL content tiers (incl. PRIVATE / in-house).
// Production-ready, no UI assumptions. Works in Pages Router or App Router.
//
// Key principles:
// 1) "private" is NEVER granted to the public. Only explicit private sessions/users.
// 2) inner-circle is a *membership gate*; tiers sit inside membership.
// 3) You can layer business rules via `checkDocumentAccess` (e.g. staff allowlist, IP check, etc.)

export type Tier =
  | "public" // free
  | "inner-circle" // basic
  | "inner-circle-plus" // premium
  | "inner-circle-elite" // enterprise
  | "private"; // in-house only (restricted)

export type AccessTierAlias =
  | "free"
  | "basic"
  | "premium"
  | "enterprise"
  | "restricted";

export type ContentTier = Tier | AccessTierAlias | "all";

export type AccessDecision =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "AUTH_REQUIRED"
        | "INNER_CIRCLE_REQUIRED"
        | "INSUFFICIENT_TIER"
        | "PRIVATE_ONLY";
      requiredTier?: Tier;
      currentTier?: Tier;
      redirectUrl?: string;
    };

export type AccessContext = {
  /** current user tier. If absent, defaults to "public" */
  tier?: Tier;
  /** inner circle membership (cookie, session claim, etc.) */
  innerCircleAccess?: boolean;

  /**
   * Explicit in-house flag. Use this for staff, admin, internal preview accounts, etc.
   * If true, tier is treated as "private" unless explicitly set higher or equal.
   */
  isInternal?: boolean;

  /** optional: used to stamp redirect urls with returnTo */
  returnTo?: string;

  /**
   * optional: allowlist approach for "private" even inside "internal" contexts
   * (e.g., only certain emails can view a specific doc).
   */
  allowPrivate?: boolean;
};

export type AccessControlledDocument = {
  slug: string;
  title?: string;
  /** Some documents are free but still inside app pages; treat as content gate */
  tier?: ContentTier[]; // e.g. ["public"] or ["inner-circle-plus"] or ["private"] or ["all"]
  /** Secondary gate. Useful for "app-only" experiences */
  requiresInnerCircle?: boolean;
  /** Optional. If true, disallow download and enforce inline-only in routes */
  previewOnly?: boolean;
};

// -----------------------------------------------------------------------------
// Tier model (order matters)
// -----------------------------------------------------------------------------
const TIER_ORDER: Record<Tier, number> = {
  public: 0,
  "inner-circle": 1,
  "inner-circle-plus": 2,
  "inner-circle-elite": 3,
  private: 99, // not "higher"; it's "different class" (restricted)
};

// aliases -> canonical
const TIER_ALIASES: Record<AccessTierAlias, Tier> = {
  free: "public",
  basic: "inner-circle",
  premium: "inner-circle-plus",
  enterprise: "inner-circle-elite",
  restricted: "private",
};

const isTier = (v: unknown): v is Tier =>
  v === "public" ||
  v === "inner-circle" ||
  v === "inner-circle-plus" ||
  v === "inner-circle-elite" ||
  v === "private";

export function resolveTierName(tier: ContentTier | undefined | null): Tier {
  if (!tier) return "public";
  if (tier === "all") return "public"; // "all" is a content marker; not a user tier
  if (isTier(tier)) return tier;
  // alias
  if (tier in TIER_ALIASES) return TIER_ALIASES[tier as AccessTierAlias];
  // fallback safe
  return "public";
}

export function getTierDisplayName(tier: ContentTier): string {
  const t = resolveTierName(tier);
  switch (t) {
    case "public":
      return "Public";
    case "inner-circle":
      return "Inner Circle";
    case "inner-circle-plus":
      return "Inner Circle Plus";
    case "inner-circle-elite":
      return "Inner Circle Elite";
    case "private":
      return "Private (In-House)";
    default:
      return "Public";
  }
}

export function getTierDescription(tier: ContentTier): string {
  const t = resolveTierName(tier);
  switch (t) {
    case "public":
      return "Open access content.";
    case "inner-circle":
      return "Member access: core tools and curated materials.";
    case "inner-circle-plus":
      return "Premium access: advanced operating systems and frameworks.";
    case "inner-circle-elite":
      return "Enterprise access: institutional-grade packs and executive tooling.";
    case "private":
      return "Internal use only: firm IP, staff previews, and restricted assets.";
    default:
      return "Open access content.";
  }
}

// -----------------------------------------------------------------------------
// Comparators
// -----------------------------------------------------------------------------
export function isHigherTier(a: Tier, b: Tier): boolean {
  // "private" is not just "higher"; treat it as separate access class.
  if (a === "private") return b !== "private"; // true unless both private
  if (b === "private") return false;
  return TIER_ORDER[a] > TIER_ORDER[b];
}

export function isSameOrHigherTier(current: Tier, required: Tier): boolean {
  if (required === "private") return current === "private";
  if (current === "private") return true; // internal can view all non-private by default
  return TIER_ORDER[current] >= TIER_ORDER[required];
}

// -----------------------------------------------------------------------------
// Inner-circle gate
// -----------------------------------------------------------------------------
export function requiresInnerCircle(doc: AccessControlledDocument): boolean {
  // Explicit doc rule wins.
  if (doc.requiresInnerCircle === true) return true;

  // Any tier above public implies inner-circle gate (unless doc tier is "all" or public).
  const tiers = normalizeDocTiers(doc);
  if (tiers.includes("private")) return true;
  return tiers.some(
    (t) => t !== "public" && t !== "all" // (all handled in normalize)
  );
}

export function hasInnerCircleAccess(ctx: AccessContext): boolean {
  // If internal, allow.
  if (ctx.isInternal) return true;
  return ctx.innerCircleAccess === true;
}

// -----------------------------------------------------------------------------
// Core access decisions
// -----------------------------------------------------------------------------
export function canAccessByTier(required: Tier, ctx: AccessContext): boolean {
  const current = deriveUserTier(ctx);

  // "private" requires explicit internal/private permission.
  if (required === "private") {
    if (current !== "private") return false;
    // optional allowlist hardening
    if (ctx.allowPrivate === false) return false;
    return true;
  }

  // Non-private resources:
  return isSameOrHigherTier(current, required);
}

export function getAccessRedirectUrl(
  decision: Extract<AccessDecision, { ok: false }>,
  ctx: AccessContext
): string {
  // You can route these to your existing pages. Keep predictable URLs.
  const returnTo = ctx.returnTo ? encodeURIComponent(ctx.returnTo) : "";
  const withReturnTo = (base: string) =>
    returnTo ? `${base}?returnTo=${returnTo}` : base;

  switch (decision.reason) {
    case "AUTH_REQUIRED":
      return withReturnTo("/login");
    case "INNER_CIRCLE_REQUIRED":
      return withReturnTo("/inner-circle");
    case "INSUFFICIENT_TIER":
      // Upsell/upgrade page. You can add requiredTier query for contextual CTA.
      return withReturnTo(
        `/inner-circle/upgrade${
          decision.requiredTier ? `?required=${encodeURIComponent(decision.requiredTier)}` : ""
        }`
      );
    case "PRIVATE_ONLY":
      // No upsell. Internal only.
      return withReturnTo("/access-denied");
    default:
      return withReturnTo("/");
  }
}

/**
 * Main policy engine.
 * - evaluates membership gate
 * - evaluates tier
 * - returns deterministic denial reason + redirect
 */
export function checkDocumentAccess(
  doc: AccessControlledDocument,
  ctx: AccessContext
): AccessDecision {
  const tiers = normalizeDocTiers(doc);

  // "all" means no tier restriction. Still may require inner-circle if doc flag set explicitly.
  const docRequiresIC = requiresInnerCircle(doc);

  // membership gate
  if (docRequiresIC && !hasInnerCircleAccess(ctx)) {
    const decision: AccessDecision = {
      ok: false,
      reason: "INNER_CIRCLE_REQUIRED",
      requiredTier: "inner-circle",
      currentTier: deriveUserTier(ctx),
    };
    return { ...decision, redirectUrl: getAccessRedirectUrl(decision, ctx) };
  }

  // private-only gate
  if (tiers.includes("private")) {
    const current = deriveUserTier(ctx);
    const allowed = current === "private" && ctx.allowPrivate !== false;
    if (!allowed) {
      const decision: AccessDecision = {
        ok: false,
        reason: "PRIVATE_ONLY",
        requiredTier: "private",
        currentTier: current,
      };
      return { ...decision, redirectUrl: getAccessRedirectUrl(decision, ctx) };
    }
    return { ok: true };
  }
  // public/all access
  if (tiers.length === 0 || tiers.includes("public")) return { ok: true };

  // required tier is the *highest* among doc tiers (most restrictive wins)
  const requiredTier = highestTierFromList(tiers.filter((t) => t !== "public"));

  if (!canAccessByTier(requiredTier, ctx)) {
    const decision: AccessDecision = {
      ok: false,
      reason: "INSUFFICIENT_TIER",
      requiredTier,
      currentTier: deriveUserTier(ctx),
    };
    return { ...decision, redirectUrl: getAccessRedirectUrl(decision, ctx) };
  }

  return { ok: true };
}

// -----------------------------------------------------------------------------
// Filtering helpers (for catalogs, search, navigation)
// -----------------------------------------------------------------------------
export function filterByAccess<T extends AccessControlledDocument>(
  docs: T[],
  ctx: AccessContext
): T[] {
  return docs.filter((d) => checkDocumentAccess(d, ctx).ok);
}

// -----------------------------------------------------------------------------
// Internals
// -----------------------------------------------------------------------------
function deriveUserTier(ctx: AccessContext): Tier {
  if (ctx.isInternal) return "private";
  return ctx.tier ?? "public";
}

function normalizeDocTiers(doc: AccessControlledDocument): Tier[] {
  const list = doc.tier ?? ["public"];

  // if "all" present, treat as public (no tier restriction)
  if (list.includes("all")) return ["public"];

  // resolve aliases and canonical names
  const resolved = list.map((t) => resolveTierName(t));

  // de-dup
  return Array.from(new Set(resolved));
}

function highestTierFromList(tiers: Tier[]): Tier {
  // private excluded earlier; this should be safe.
  // if nothing left, default public.
  if (tiers.length === 0) return "public";

  // pick highest numeric order among non-private
  return tiers.reduce((acc, t) => {
    if (t === "private") return acc;
    if (acc === "private") return t;
    return TIER_ORDER[t] > TIER_ORDER[acc] ? t : acc;
  }, tiers[0]);
}
