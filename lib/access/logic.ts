// lib/access/logic.ts — SSOT Access Engine (Next-safe, production-stable)

import tiers, { type AccessTier } from "@/lib/access/tiers";

export type ContentTier = AccessTier | "all";

export type AccessDecision =
  | { ok: true; redirectUrl?: string }
  | {
      ok: false;
      reason:
        | "AUTH_REQUIRED"
        | "INNER_CIRCLE_REQUIRED"
        | "INSUFFICIENT_TIER"
        | "PRIVATE_ONLY"
        | "MAINTENANCE_MODE"
        | "GEO_BLOCKED"
        | "RATE_LIMITED";
      requiredTier?: AccessTier;
      currentTier?: AccessTier;
      redirectUrl?: string;
      maintenanceUntil?: string;
      retryAfter?: number;
      suggestedAction?: "upgrade" | "login" | "contact_support";
    };

export type AccessContext = {
  /** current user tier (raw). If absent, defaults to "public" */
  tier?: unknown;

  /** membership marker (cookie/session claim/etc.) */
  innerCircleAccess?: boolean;

  /** internal staff / admin bypass */
  isInternal?: boolean;

  /** used to stamp redirect urls with returnTo */
  returnTo?: string;

  /** optional extra hardening for internal/private */
  allowPrivate?: boolean;

  /** audit / rules inputs */
  userId?: string;
  userEmail?: string;
  roles?: string[];
  ipAddress?: string;
  userAgent?: string;
  requestTime?: Date;
  sessionId?: string;

  /** subscription (optional) */
  subscription?: {
    status: "active" | "canceled" | "expired" | "trialing";
    expiresAt?: Date;
    canceledAt?: Date;
    planId?: string;
  };
};

export type AccessControlledDocument = {
  slug: string;
  title?: string;

  /**
   * Document tier requirements.
   * - ["all"] or undefined means "public"
   * - otherwise a list of tiers; most restrictive wins
   */
  tier?: ContentTier[];

  /** Secondary membership gate */
  requiresInnerCircle?: boolean;

  /** Preview-only mode (optional, does not change access decision itself) */
  previewOnly?: boolean;

  /** Fine-grain rules (optional) */
  accessRules?: {
    allowedEmails?: string[];
    allowedUserIds?: string[];
    requiredRoles?: string[];
    blockedCountries?: string[];
    accessHours?: { start: string; end: string; timezone?: string }[];
    expiresAt?: string;
    availableFrom?: string;
  };
};

// -----------------------------------------------------------------------------
// Business configuration (lightweight, safe defaults)
// -----------------------------------------------------------------------------
export const ACCESS_CONFIG = {
  maintenanceMode: {
    enabled: false,
    message: "System maintenance in progress",
    estimatedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000),
    // If enabled, only these tiers can pass (optional)
    allowedTiers: ["owner", "architect"] as AccessTier[],
  },

  geoBlocking: {
    enabled: false,
    blockedCountries: [] as string[],
  },

  auditLogging: {
    enabled: process.env.NODE_ENV === "production",
  },
} as const;

// -----------------------------------------------------------------------------
// Core helpers
// -----------------------------------------------------------------------------
function nowOf(ctx: AccessContext) {
  return ctx.requestTime instanceof Date ? ctx.requestTime : new Date();
}

function normalizeDocTiers(doc: AccessControlledDocument): AccessTier[] {
  const list = Array.isArray(doc.tier) && doc.tier.length ? doc.tier : ["public"];

  // "all" means “no tier restriction”
  if (list.includes("all")) return ["public"];

  // Normalize via REQUIRED-normalizer so typos never create paywalls
  const normalized = list
    .map((t) => tiers.normalizeRequired(t))
    .filter(Boolean);

  // De-dup
  return Array.from(new Set(normalized));
}

/**
 * Most-restrictive tier wins.
 * Example: ["public","member","client"] => "client"
 */
function mostRestrictiveTier(list: AccessTier[]): AccessTier {
  // Empty => public
  if (!list.length) return "public";

  // Use the SSOT order array from tiers.ts
  const order = tiers.order as readonly AccessTier[];

  return list.reduce<AccessTier>((acc, t) => {
    return order.indexOf(t) > order.indexOf(acc) ? t : acc;
  }, "public");
}

/**
 * Derive user tier from ctx:
 * - internal => owner (max)
 * - subscription planId can map to tiers (optional)
 * - else ctx.tier normalized as USER tier
 */
function deriveUserTier(ctx: AccessContext): AccessTier {
  if (ctx.isInternal) {
    // internal bypass to maximum tier
    return "owner";
  }

  // subscription sanity (optional)
  const sub = ctx.subscription;
  if (sub) {
    if (sub.status !== "active") return "public";
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) return "public";

    // Map plan -> tier (adjust these to your actual plan IDs)
    if (sub.planId) {
      const planTierMap: Record<string, AccessTier> = {
        "member-plan": "member",
        "inner-circle-plan": "inner-circle",
        "client-plan": "client",
        "legacy-plan": "legacy",
      };
      const mapped = planTierMap[sub.planId];
      if (mapped) return mapped;
    }
  }

  return tiers.normalizeUser(ctx.tier ?? "public");
}

/**
 * Whether a doc requires membership gate (auth cookie/session) even before tier.
 * Rule: any tier > public implies membership required.
 */
export function requiresInnerCircle(doc: AccessControlledDocument): boolean {
  if (doc.requiresInnerCircle === true) return true;

  const list = normalizeDocTiers(doc);
  const required = mostRestrictiveTier(list);
  return required !== "public";
}

export function hasInnerCircleAccess(ctx: AccessContext): boolean {
  if (ctx.isInternal) return true;
  return ctx.innerCircleAccess === true;
}

// -----------------------------------------------------------------------------
// Advanced rules
// -----------------------------------------------------------------------------
function checkDocumentSpecificRules(doc: AccessControlledDocument, ctx: AccessContext): AccessDecision | null {
  const rules = doc.accessRules;
  if (!rules) return null;

  const now = nowOf(ctx);

  // expiry window
  if (rules.expiresAt) {
    const expiresAt = new Date(rules.expiresAt);
    if (!Number.isNaN(expiresAt.getTime()) && now > expiresAt) {
      return {
        ok: false,
        reason: "INSUFFICIENT_TIER",
        requiredTier: "client",
        currentTier: deriveUserTier(ctx),
        suggestedAction: "contact_support",
      };
    }
  }

  // availability window
  if (rules.availableFrom) {
    const availableFrom = new Date(rules.availableFrom);
    if (!Number.isNaN(availableFrom.getTime()) && now < availableFrom) {
      return {
        ok: false,
        reason: "INSUFFICIENT_TIER",
        requiredTier: "client",
        currentTier: deriveUserTier(ctx),
        suggestedAction: "contact_support",
      };
    }
  }

  // allowlist emails
  if (Array.isArray(rules.allowedEmails) && rules.allowedEmails.length) {
    const email = String(ctx.userEmail || "").toLowerCase().trim();
    if (!email) {
      return { ok: false, reason: "AUTH_REQUIRED", currentTier: deriveUserTier(ctx), suggestedAction: "login" };
    }
    const ok = rules.allowedEmails.some((e) => String(e).toLowerCase().trim() === email);
    if (!ok) {
      return { ok: false, reason: "PRIVATE_ONLY", currentTier: deriveUserTier(ctx), suggestedAction: "contact_support" };
    }
  }

  // allowlist userIds
  if (Array.isArray(rules.allowedUserIds) && rules.allowedUserIds.length) {
    const uid = String(ctx.userId || "").trim();
    if (!uid || !rules.allowedUserIds.includes(uid)) {
      return { ok: false, reason: "PRIVATE_ONLY", currentTier: deriveUserTier(ctx), suggestedAction: "contact_support" };
    }
  }

  // required roles
  if (Array.isArray(rules.requiredRoles) && rules.requiredRoles.length) {
    const roles = Array.isArray(ctx.roles) ? ctx.roles : [];
    const ok = rules.requiredRoles.some((r) => roles.includes(r));
    if (!ok) {
      return { ok: false, reason: "PRIVATE_ONLY", currentTier: deriveUserTier(ctx), suggestedAction: "contact_support" };
    }
  }

  // blocked countries (placeholder – you’ll need real geo lookup)
  if (Array.isArray(rules.blockedCountries) && rules.blockedCountries.length) {
    // Implement real geo lookup later; for now do nothing.
  }

  // access hours (safe, best-effort)
  if (Array.isArray(rules.accessHours) && rules.accessHours.length) {
    const ok = rules.accessHours.some((w) => {
      if (!w) return false;
      const tz = w.timezone || "UTC";

      const start = String(w.start || "00:00");
      const end = String(w.end || "23:59");

      const startHour = parseInt(start.split(":")[0] || "0", 10);
      const endHour = parseInt(end.split(":")[0] || "23", 10);

      const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
      const h = local.getHours();

      // simple hour window; refine later if you need minutes + wrap-around support
      return h >= startHour && h < endHour;
    });

    if (!ok) {
      return { ok: false, reason: "INSUFFICIENT_TIER", currentTier: deriveUserTier(ctx), suggestedAction: "contact_support" };
    }
  }

  return null;
}

function checkMaintenanceMode(ctx: AccessContext): AccessDecision | null {
  if (!ACCESS_CONFIG.maintenanceMode.enabled) return null;

  const userTier = deriveUserTier(ctx);
  const allowed = ACCESS_CONFIG.maintenanceMode.allowedTiers.includes(userTier);

  if (!allowed) {
    return {
      ok: false,
      reason: "MAINTENANCE_MODE",
      currentTier: userTier,
      maintenanceUntil: ACCESS_CONFIG.maintenanceMode.estimatedCompletion.toISOString(),
      suggestedAction: "contact_support",
    };
  }

  return null;
}

function checkGeoBlocking(_ctx: AccessContext): AccessDecision | null {
  if (!ACCESS_CONFIG.geoBlocking.enabled) return null;
  // Add real geo later.
  return null;
}

// -----------------------------------------------------------------------------
// Redirect builder
// -----------------------------------------------------------------------------
export function getAccessRedirectUrl(decision: AccessDecision, ctx: AccessContext): string {
  const returnTo = ctx.returnTo ? encodeURIComponent(ctx.returnTo) : "";
  const withReturnTo = (base: string) => (returnTo ? `${base}?returnTo=${returnTo}` : base);

  if (decision.ok) return decision.redirectUrl || withReturnTo("/");

  switch (decision.reason) {
    case "AUTH_REQUIRED":
      return withReturnTo("/login");

    case "INNER_CIRCLE_REQUIRED":
      return withReturnTo("/inner-circle");

    case "INSUFFICIENT_TIER":
      return withReturnTo(
        `/inner-circle/upgrade${decision.requiredTier ? `?required=${encodeURIComponent(decision.requiredTier)}` : ""}`
      );

    case "PRIVATE_ONLY":
      return withReturnTo("/access-denied");

    case "MAINTENANCE_MODE":
      return withReturnTo("/maintenance");

    case "GEO_BLOCKED":
      return withReturnTo("/geo-blocked");

    case "RATE_LIMITED":
      return withReturnTo("/rate-limited");

    default:
      return withReturnTo("/");
  }
}

// -----------------------------------------------------------------------------
// Main engine
// -----------------------------------------------------------------------------
export function checkDocumentAccess(doc: AccessControlledDocument, ctx: AccessContext): AccessDecision {
  // Maintenance
  const maintenance = checkMaintenanceMode(ctx);
  if (maintenance) {
    const d: AccessDecision = maintenance;
    return { ...d, redirectUrl: getAccessRedirectUrl(d, ctx) };
  }

  // Geo
  const geo = checkGeoBlocking(ctx);
  if (geo) {
    const d: AccessDecision = geo;
    return { ...d, redirectUrl: getAccessRedirectUrl(d, ctx) };
  }

  // Doc specific rules
  const docRules = checkDocumentSpecificRules(doc, ctx);
  if (docRules) {
    const d: AccessDecision = docRules;
    return { ...d, redirectUrl: getAccessRedirectUrl(d, ctx) };
  }

  const userTier = deriveUserTier(ctx);

  // Membership gate
  if (requiresInnerCircle(doc) && !hasInnerCircleAccess(ctx)) {
    const d: AccessDecision = {
      ok: false,
      reason: "INNER_CIRCLE_REQUIRED",
      requiredTier: "member",
      currentTier: userTier,
      suggestedAction: "upgrade",
    };
    return { ...d, redirectUrl: getAccessRedirectUrl(d, ctx) };
  }

  // Tier gate
  const docTiers = normalizeDocTiers(doc);
  const requiredTier = mostRestrictiveTier(docTiers);

  // Public is always readable once membership gate (if any) is passed
  if (requiredTier === "public") return { ok: true };

  // Internal can optionally be restricted further
  if (ctx.isInternal && ctx.allowPrivate === false) {
    const d: AccessDecision = {
      ok: false,
      reason: "PRIVATE_ONLY",
      requiredTier,
      currentTier: userTier,
      suggestedAction: "contact_support",
    };
    return { ...d, redirectUrl: getAccessRedirectUrl(d, ctx) };
  }

  const ok = tiers.hasAccess(userTier, requiredTier);
  if (!ok) {
    const d: AccessDecision = {
      ok: false,
      reason: "INSUFFICIENT_TIER",
      requiredTier,
      currentTier: userTier,
      suggestedAction: "upgrade",
    };
    return { ...d, redirectUrl: getAccessRedirectUrl(d, ctx) };
  }

  // Audit success
  if (ACCESS_CONFIG.auditLogging.enabled && ctx.userId) {
    // keep it cheap
    console.log(`[ACCESS_OK] user=${ctx.userId} tier=${userTier} doc=${doc.slug} required=${requiredTier}`);
  }

  return { ok: true };
}

// -----------------------------------------------------------------------------
// Catalog helpers
// -----------------------------------------------------------------------------
export function filterByAccess<T extends AccessControlledDocument>(docs: T[], ctx: AccessContext): T[] {
  return docs.filter((d) => checkDocumentAccess(d, ctx).ok);
}

export function createMockAccessContext(overrides: Partial<AccessContext> = {}): AccessContext {
  return {
    tier: "public",
    innerCircleAccess: false,
    isInternal: false,
    userId: "test-user-123",
    userEmail: "test@example.com",
    roles: ["user"],
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 Test",
    requestTime: new Date(),
    sessionId: "test-session-123",
    ...overrides,
  };
}

/**
 * Parse access context from a request-like shape (safe, low-assumption)
 */
export function parseAccessContextFromRequest(req: {
  headers?: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
  ip?: string;
}): AccessContext {
  const cookies = req.cookies || {};
  const headers = req.headers || {};

  return {
    tier: cookies["access-tier"] ?? cookies["tier"] ?? "public",
    innerCircleAccess: cookies["innerCircleAccess"] === "true" || cookies["inner-circle"] === "true",
    isInternal: cookies["internal-access"] === "true",
    ipAddress:
      req.ip ||
      (typeof headers["x-forwarded-for"] === "string" ? headers["x-forwarded-for"].split(",")[0]?.trim() : undefined),
    userAgent: typeof headers["user-agent"] === "string" ? headers["user-agent"] : undefined,
    sessionId: cookies["session-id"],
    requestTime: new Date(),
  };
}