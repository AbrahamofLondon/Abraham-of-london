// lib/inner-circle/access.server.ts — Server-only Inner Circle access gate (Next-agnostic)
import tiers, { type AccessTier } from "@/lib/access/tiers";

function assertServerOnly(moduleName: string) {
  if (typeof window !== "undefined") {
    throw new Error(
      `[${moduleName}] is server-only but was loaded in the browser. ` +
        `Move the import into getServerSideProps/getStaticProps or an API route.`
    );
  }
}
assertServerOnly("lib/inner-circle/access.server.ts");

export type InnerCircleAccessReason =
  | "no_request"
  | "requires_auth"
  | "insufficient_tier"
  | "session_expired"
  | "invalid_token"
  | "internal_error";

export type InnerCircleAccess = {
  hasAccess: boolean;
  reason: InnerCircleAccessReason;
  tier: AccessTier;
};

// Use tiers.order for hierarchy (kept for parity)
const TIER_ORDER = tiers.order;

// ---- Next-agnostic "request-like" typing ----
type RequestLike = {
  headers?:
    | { cookie?: string | undefined; [k: string]: any }
    | { get?: (key: string) => string | null | undefined; [k: string]: any }
    | any;
};

// -----------------------------------------------------------------------------
// Tier utilities
// -----------------------------------------------------------------------------

export function normalizeTier(input: unknown): AccessTier {
  return tiers.normalizeUser(input);
}

export function hasTierAccess(userTier: AccessTier, requiredTier: AccessTier) {
  return tiers.hasAccess(userTier, requiredTier);
}

// -----------------------------------------------------------------------------
// Cookie parsing
// -----------------------------------------------------------------------------

function parseCookieHeader(cookieHeader: string | undefined | null): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = String(cookieHeader || "");
  if (!raw) return out;

  raw.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) return;
    out[k] = decodeURIComponent(v);
  });

  return out;
}

const TIER_COOKIE_KEYS = ["aol_tier", "aol_ic_tier", "inner_circle_tier", "ic_tier"];

function extractTierFromReq(req: RequestLike): { tier: AccessTier; hasSession: boolean } {
  const headers: any = req?.headers;

  const cookieHeader =
    (headers && typeof headers.cookie === "string" ? headers.cookie : "") ||
    (headers && typeof headers.get === "function" ? headers.get("cookie") : "") ||
    "";

  const cookies = parseCookieHeader(cookieHeader);

  // 1) Explicit tier cookie wins
  for (const key of TIER_COOKIE_KEYS) {
    if (cookies[key]) return { tier: tiers.normalizeUser(cookies[key]), hasSession: true };
  }

  // 2) If next-auth session cookie exists, treat as "member"
  const hasNextAuth =
    Boolean(cookies["next-auth.session-token"]) ||
    Boolean(cookies["__Secure-next-auth.session-token"]);

  if (hasNextAuth) return { tier: "member", hasSession: true };

  // 3) No signal: public
  return { tier: "public", hasSession: false };
}

// -----------------------------------------------------------------------------
// Main access function
// -----------------------------------------------------------------------------

type ParamsMode = { userTier?: unknown; requiresTier?: AccessTier; requiredTier?: AccessTier };

export function getInnerCircleAccess(reqOrParams: RequestLike | ParamsMode | any, requiredTierMaybe?: AccessTier): InnerCircleAccess {
  try {
    // params-mode (tests/internal calls)
    if (
      reqOrParams &&
      typeof reqOrParams === "object" &&
      ("userTier" in reqOrParams || "requiresTier" in reqOrParams || "requiredTier" in reqOrParams)
    ) {
      const userTier = tiers.normalizeUser((reqOrParams as any).userTier);
      const requiredTier = tiers.normalizeRequired(
        (reqOrParams as any).requiresTier ?? (reqOrParams as any).requiredTier ?? "public"
      );

      if (requiredTier === "public") return { hasAccess: true, reason: "no_request", tier: userTier };

      return tiers.hasAccess(userTier, requiredTier)
        ? { hasAccess: true, reason: "no_request", tier: userTier }
        : { hasAccess: false, reason: "insufficient_tier", tier: userTier };
    }

    // req-mode (SSR/API)
    const requiredTier = tiers.normalizeRequired(requiredTierMaybe ?? "member");
    const { tier: userTier, hasSession } = extractTierFromReq(reqOrParams as RequestLike);

    if (requiredTier === "public") return { hasAccess: true, reason: "no_request", tier: userTier };

    if (!hasSession || userTier === "public") {
      return { hasAccess: false, reason: "requires_auth", tier: "public" };
    }

    if (!tiers.hasAccess(userTier, requiredTier)) {
      return { hasAccess: false, reason: "insufficient_tier", tier: userTier };
    }

    return { hasAccess: true, reason: "no_request", tier: userTier };
  } catch {
    return { hasAccess: false, reason: "internal_error", tier: "public" };
  }
}