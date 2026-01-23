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
  | { ok: true; redirectUrl?: string } // Allow optional redirectUrl here
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
      requiredTier?: Tier;
      currentTier?: Tier;
      redirectUrl?: string; // Already exists here
      maintenanceUntil?: string;
      retryAfter?: number; // seconds
      suggestedAction?: "upgrade" | "login" | "contact_support";
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
  
  /**
   * optional: User ID for audit logging and fine-grained permissions
   */
  userId?: string;
  
  /**
   * optional: User email for allowlist checks
   */
  userEmail?: string;
  
  /**
   * optional: User roles for advanced permission logic
   */
  roles?: string[];
  
  /**
   * optional: IP address for geo-blocking or rate limiting
   */
  ipAddress?: string;
  
  /**
   * optional: User agent for device/context awareness
   */
  userAgent?: string;
  
  /**
   * optional: Request timestamp for time-based access rules
   */
  requestTime?: Date;
  
  /**
   * optional: Session metadata
   */
  sessionId?: string;
  
  /**
   * optional: Subscription status and expiration
   */
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
  /** Some documents are free but still inside app pages; treat as content gate */
  tier?: ContentTier[]; // e.g. ["public"] or ["inner-circle-plus"] or ["private"] or ["all"]
  /** Secondary gate. Useful for "app-only" experiences */
  requiresInnerCircle?: boolean;
  /** Optional. If true, disallow download and enforce inline-only in routes */
  previewOnly?: boolean;
  /** Optional: Document-specific access rules */
  accessRules?: {
    /** Allow specific users by email */
    allowedEmails?: string[];
    /** Allow specific users by ID */
    allowedUserIds?: string[];
    /** Require specific roles */
    requiredRoles?: string[];
    /** Block specific countries by ISO code */
    blockedCountries?: string[];
    /** Allow access only during specific time windows (ISO time ranges) */
    accessHours?: { start: string; end: string; timezone?: string }[];
    /** Maximum views per user */
    maxViewsPerUser?: number;
    /** Expiration date for document access */
    expiresAt?: string;
    /** Available from date */
    availableFrom?: string;
  };
  /** Audit logging metadata */
  audit?: {
    createdBy?: string;
    createdAt?: string;
    lastModifiedBy?: string;
    lastModifiedAt?: string;
  };
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
} as const;

// aliases -> canonical
const TIER_ALIASES: Record<AccessTierAlias, Tier> = {
  free: "public",
  basic: "inner-circle",
  premium: "inner-circle-plus",
  enterprise: "inner-circle-elite",
  restricted: "private",
} as const;

const TIER_NAMES = Object.keys(TIER_ORDER) as Tier[];

// Business configuration - can be environment-based
export const ACCESS_CONFIG = {
  // Enable maintenance mode for specific tiers
  maintenanceMode: {
    enabled: false,
    allowedTiers: ["private", "inner-circle-elite"] as Tier[],
    message: "System maintenance in progress",
    estimatedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  },
  // Rate limiting configuration
  rateLimiting: {
    enabled: process.env.NODE_ENV === "production",
    requestsPerMinute: {
      public: 30,
      "inner-circle": 60,
      "inner-circle-plus": 100,
      "inner-circle-elite": 200,
      private: 500,
    },
  },
  // Geo-blocking configuration
  geoBlocking: {
    enabled: false,
    blockedCountries: [] as string[], // ISO country codes
    allowedCountries: ["US", "CA", "GB", "AU", "NZ"], // Allow only these
  },
  // Audit logging
  auditLogging: {
    enabled: process.env.NODE_ENV === "production",
    logLevel: "info" as "info" | "warn" | "error",
  },
} as const;

const isTier = (v: unknown): v is Tier =>
  TIER_NAMES.includes(v as Tier);

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

  // Any tier above public implies inner-circle gate
  const tiers = normalizeDocTiers(doc);
  if (tiers.includes("private")) return true;
  
  // Check if there are any non-public tiers
  // normalizeDocTiers already converts "all" to ["public"]
  return tiers.some(tier => tier !== "public");
}

export function hasInnerCircleAccess(ctx: AccessContext): boolean {
  // If internal, allow.
  if (ctx.isInternal) return true;
  
  // Check subscription status
  if (ctx.subscription) {
    if (ctx.subscription.status !== "active") return false;
    if (ctx.subscription.expiresAt && new Date(ctx.subscription.expiresAt) < new Date()) {
      return false;
    }
  }
  
  return ctx.innerCircleAccess === true;
}

// -----------------------------------------------------------------------------
// Advanced access checks
// -----------------------------------------------------------------------------
function checkDocumentSpecificRules(
  doc: AccessControlledDocument,
  ctx: AccessContext
): AccessDecision | null {
  const rules = doc.accessRules;
  if (!rules) return null;

  const now = ctx.requestTime || new Date();
  
  // Check expiration
  if (rules.expiresAt) {
    const expiresAt = new Date(rules.expiresAt);
    if (now > expiresAt) {
      return {
        ok: false,
        reason: "INSUFFICIENT_TIER",
        requiredTier: "private",
        currentTier: deriveUserTier(ctx),
        suggestedAction: "contact_support",
      };
    }
  }

  // Check availability date
  if (rules.availableFrom) {
    const availableFrom = new Date(rules.availableFrom);
    if (now < availableFrom) {
      return {
        ok: false,
        reason: "INSUFFICIENT_TIER",
        requiredTier: "private",
        currentTier: deriveUserTier(ctx),
        suggestedAction: "contact_support",
      };
    }
  }

  // Check allowed emails
  if (rules.allowedEmails && ctx.userEmail) {
    const normalizedEmail = ctx.userEmail.toLowerCase().trim();
    const isAllowed = rules.allowedEmails.some(
      email => email.toLowerCase().trim() === normalizedEmail
    );
    if (!isAllowed) {
      return {
        ok: false,
        reason: "PRIVATE_ONLY",
        currentTier: deriveUserTier(ctx),
        suggestedAction: "contact_support",
      };
    }
  }

  // Check allowed user IDs
  if (rules.allowedUserIds && ctx.userId) {
    if (!rules.allowedUserIds.includes(ctx.userId)) {
      return {
        ok: false,
        reason: "PRIVATE_ONLY",
        currentTier: deriveUserTier(ctx),
        suggestedAction: "contact_support",
      };
    }
  }

  // Check required roles
  if (rules.requiredRoles && ctx.roles) {
    const hasRequiredRole = rules.requiredRoles.some(role =>
      ctx.roles!.includes(role)
    );
    if (!hasRequiredRole) {
      return {
        ok: false,
        reason: "PRIVATE_ONLY",
        currentTier: deriveUserTier(ctx),
        suggestedAction: "contact_support",
      };
    }
  }

  // Check access hours - ROBUST VERSION
if (rules.accessHours && rules.accessHours.length > 0) {
  const firstAccessHour = rules.accessHours[0];
  if (!firstAccessHour) return null;
  
  const userTimezone = firstAccessHour.timezone || "UTC";
  const userNow = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
  
  const isWithinAccessHours = rules.accessHours.some((rule) => {
    if (!rule) return false;
    
    // Ensure we have valid start and end times
    const startTime = String(rule.start || "00:00");
    const endTime = String(rule.end || "00:00");
    
    const startHour = parseInt(startTime.split(':')[0] || "0");
    const endHour = parseInt(endTime.split(':')[0] || "0");
    
    const ruleTimezone = rule.timezone || userTimezone;
    const ruleNow = new Date(now.toLocaleString("en-US", { timeZone: ruleTimezone }));
    const ruleHour = ruleNow.getHours();
    
    return ruleHour >= startHour && ruleHour < endHour;
  });
  
  if (!isWithinAccessHours) {
    return {
      ok: false,
      reason: "INSUFFICIENT_TIER",
      currentTier: deriveUserTier(ctx),
      suggestedAction: "contact_support",
    };
  }
}

  return null;
}

function checkMaintenanceMode(ctx: AccessContext): AccessDecision | null {
  if (!ACCESS_CONFIG.maintenanceMode.enabled) return null;
  
  const userTier = deriveUserTier(ctx);
  
  if (!ACCESS_CONFIG.maintenanceMode.allowedTiers.includes(userTier)) {
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

function checkGeoBlocking(ctx: AccessContext): AccessDecision | null {
  if (!ACCESS_CONFIG.geoBlocking.enabled || !ctx.ipAddress) return null;
  
  // In a real implementation, you would:
  // 1. Use a geo-IP service or local database
  // 2. Check country against ACCESS_CONFIG.geoBlocking.blockedCountries
  // 3. Or check against allowedCountries if using allowlist approach
  
  // This is a placeholder implementation
  const mockCountryCode = "US"; // You would get this from IP
  
  if (ACCESS_CONFIG.geoBlocking.blockedCountries.includes(mockCountryCode)) {
    return {
      ok: false,
      reason: "GEO_BLOCKED",
      currentTier: deriveUserTier(ctx),
      suggestedAction: "contact_support",
    };
  }
  
  return null;
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

/**
 * STRATEGIC FIX: Accept generic AccessDecision.
 * Handles both ok: true and ok: false branches of the union.
 */
export function getAccessRedirectUrl(
  decision: AccessDecision,
  ctx: AccessContext
): string {
  // You can route these to your existing pages. Keep predictable URLs.
  const returnTo = ctx.returnTo ? encodeURIComponent(ctx.returnTo) : "";
  const withReturnTo = (base: string) =>
    returnTo ? `${base}?returnTo=${returnTo}` : base;

  // If technically 'ok', return home or provided custom redirect
  if (decision.ok) return decision.redirectUrl || withReturnTo("/");

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

/**
 * Main policy engine.
 * - evaluates maintenance mode
 * - evaluates geo-blocking
 * - evaluates document-specific rules
 * - evaluates membership gate
 * - evaluates tier
 * - returns deterministic denial reason + redirect
 */
export function checkDocumentAccess(
  doc: AccessControlledDocument,
  ctx: AccessContext
): AccessDecision {
  // Check maintenance mode
  const maintenanceCheck = checkMaintenanceMode(ctx);
  if (maintenanceCheck) {
    const decision: AccessDecision = maintenanceCheck;
    return { ...decision, redirectUrl: getAccessRedirectUrl(decision, ctx) };
  }

  // Check geo-blocking
  const geoCheck = checkGeoBlocking(ctx);
  if (geoCheck) {
    const decision: AccessDecision = geoCheck;
    return { ...decision, redirectUrl: getAccessRedirectUrl(decision, ctx) };
  }

  // Check document-specific rules
  const docRulesCheck = checkDocumentSpecificRules(doc, ctx);
  if (docRulesCheck) {
    const decision: AccessDecision = docRulesCheck;
    return { ...decision, redirectUrl: getAccessRedirectUrl(decision, ctx) };
  }

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

  // Log successful access (in production)
  if (ACCESS_CONFIG.auditLogging.enabled && ctx.userId) {
    console.log(`[ACCESS] ${ctx.userId} accessed ${doc.slug} at ${new Date().toISOString()}`);
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

/**
 * Get accessible documents grouped by tier
 */
export function groupDocumentsByAccessibleTier<T extends AccessControlledDocument>(
  docs: T[],
  ctx: AccessContext
): Record<Tier, T[]> {
  const groups = {} as Record<Tier, T[]>;
  
  // Initialize groups
  TIER_NAMES.forEach(tier => {
    groups[tier] = [];
  });
  
  // Group documents
  docs.forEach(doc => {
    const tiers = normalizeDocTiers(doc);
    
    // For each tier that the user can access, add the document
    tiers.forEach(tier => {
      if (canAccessByTier(tier, ctx)) {
        groups[tier].push(doc);
      }
    });
  });
  
  return groups;
}

/**
 * Check if user can upgrade to a specific tier
 */
export function canUpgradeToTier(
  currentTier: Tier,
  targetTier: Tier
): { allowed: boolean; reason?: string } {
  if (currentTier === "private") {
    return { allowed: false, reason: "Private tier cannot be upgraded from" };
  }
  
  if (targetTier === "private") {
    return { allowed: false, reason: "Private tier is invite-only" };
  }
  
  if (isSameOrHigherTier(currentTier, targetTier)) {
    return { allowed: false, reason: "Already at or above target tier" };
  }
  
  return { allowed: true };
}

// -----------------------------------------------------------------------------
// Internals
// -----------------------------------------------------------------------------
function deriveUserTier(ctx: AccessContext): Tier {
  if (ctx.isInternal) return "private";
  
  // Check subscription status
  if (ctx.subscription) {
    if (ctx.subscription.status !== "active") return "public";
    if (ctx.subscription.expiresAt && new Date(ctx.subscription.expiresAt) < new Date()) {
      return "public";
    }
    
    // Map planId to tier if available
    if (ctx.subscription.planId) {
      const planTierMap: Record<string, Tier> = {
        "basic-plan": "inner-circle",
        "premium-plan": "inner-circle-plus",
        "elite-plan": "inner-circle-elite",
      };
      
      const tierFromPlan = planTierMap[ctx.subscription.planId];
      if (tierFromPlan) return tierFromPlan;
    }
  }
  
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
  // If no tiers are provided, default to public (most permissive)
  if (!tiers || tiers.length === 0) return "public";

  // Use "public" as the initial value (seed) for the reduction.
  // This ensures 'acc' is never undefined.
  return tiers.reduce((acc: Tier, t: Tier) => {
    // 1. Private is a separate class; ignore it in numeric comparison
    if (t === "private") return acc;
    if (acc === "private") return t;

    // 2. Compare numeric order defined in TIER_ORDER
    // If current tier 't' is higher than accumulator 'acc', it becomes the new winner.
    return TIER_ORDER[t] > TIER_ORDER[acc] ? t : acc;
  }, "public" as Tier); 
}

/**
 * Utility to create a mock access context for testing
 */
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
 * Parse access context from request (for server-side usage)
 */
export function parseAccessContextFromRequest(req: {
  headers: Record<string, string | string[] | undefined>;
  cookies: Record<string, string>;
  ip?: string;
}): AccessContext {
  return {
    tier: req.cookies["access-tier"] as Tier | undefined,
    innerCircleAccess: req.cookies["inner-circle"] === "true",
    isInternal: req.cookies["internal-access"] === "true",
    ipAddress: req.ip || (req.headers["x-forwarded-for"] as string)?.split(",")[0] || undefined,
    userAgent: req.headers["user-agent"] as string | undefined,
    sessionId: req.cookies["session-id"],
    requestTime: new Date(),
  };
}