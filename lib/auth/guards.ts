// lib/auth/guards.ts — UNIFIED AUTH ENFORCEMENT
// (auth-migration/04-execution-order.md, Phase 2)
//
// Two wrappers. One for pages (withAuth). One for APIs (withApiAuth).
// Both delegate to resolveIdentity() + canonical tier check.
// Replaces: withAdminAuth, withInnerCircleAuth, withUnifiedAuth,
// withTierAccess, and ad-hoc per-route auth checks.

import type { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import {
  resolveIdentity,
  identityHasAccess,
  type ResolvedIdentity,
} from "./resolve-identity";
import type { Tier } from "./tiers";

/* -------------------------------------------------------------------------- */
/*  API ROUTE GUARD                                                            */
/* -------------------------------------------------------------------------- */

type AuthedApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  identity: ResolvedIdentity,
) => Promise<void | NextApiResponse> | void | NextApiResponse;

/**
 * Wrap a Pages Router API handler with canonical tier enforcement.
 *
 * Usage:
 *   export default withApiAuth("inner_circle", async (req, res, identity) => {
 *     // identity is guaranteed to be authenticated at inner_circle+
 *   });
 */
export function withApiAuth(
  requiredTier: Tier,
  handler: AuthedApiHandler,
): NextApiHandler {
  return async (req, res) => {
    const identity = await resolveIdentity(req);

    if (!identityHasAccess(identity, requiredTier)) {
      const status = identity.authenticated ? 403 : 401;
      const code = identity.authenticated
        ? "INSUFFICIENT_CLEARANCE"
        : "AUTH_REQUIRED";

      return res.status(status).json({
        ok: false,
        error: code,
        requiredTier,
        currentTier: identity.tier,
      });
    }

    return handler(req, res, identity);
  };
}

/**
 * Resolve identity for an API route without enforcing a tier.
 * Returns the identity for the handler to inspect.
 */
export async function getIdentity(
  req: NextApiRequest,
): Promise<ResolvedIdentity> {
  return resolveIdentity(req);
}

/* -------------------------------------------------------------------------- */
/*  PAGE-LEVEL GUARD (for getServerSideProps)                                  */
/* -------------------------------------------------------------------------- */

/**
 * For use in getServerSideProps. Returns the resolved identity or
 * redirects to the appropriate login/access page.
 *
 * Usage:
 *   export const getServerSideProps = async (ctx) => {
 *     const identity = await requirePageAuth(ctx.req, "inner_circle");
 *     if ("redirect" in identity) return identity;
 *     // identity is ResolvedIdentity
 *   };
 */
export async function requirePageAuth(
  req: NextApiRequest,
  requiredTier: Tier,
): Promise<
  | ResolvedIdentity
  | { redirect: { destination: string; permanent: false } }
> {
  const identity = await resolveIdentity(req);

  if (identityHasAccess(identity, requiredTier)) {
    return identity;
  }

  // Determine redirect destination based on what's needed
  let destination = "/";
  if (requiredTier === "architect" || requiredTier === "owner") {
    destination = "/admin/login";
  } else if (
    requiredTier === "inner_circle" ||
    requiredTier === "client"
  ) {
    destination = "/inner-circle";
  } else if (requiredTier === "member") {
    destination = "/api/auth/signin";
  }

  return {
    redirect: { destination, permanent: false },
  };
}

/* -------------------------------------------------------------------------- */
/*  APP ROUTER GUARD                                                           */
/* -------------------------------------------------------------------------- */

/**
 * For use in App Router route handlers.
 *
 * Usage:
 *   export async function GET(req: Request) {
 *     const identity = await requireAppAuth(req, "architect");
 *     if (identity instanceof Response) return identity;
 *   }
 */
export async function requireAppAuth(
  req: Request,
  requiredTier: Tier,
): Promise<ResolvedIdentity | Response> {
  const identity = await resolveIdentity(req as any);

  if (identityHasAccess(identity, requiredTier)) {
    return identity;
  }

  const status = identity.authenticated ? 403 : 401;
  return new Response(
    JSON.stringify({
      ok: false,
      error: identity.authenticated
        ? "INSUFFICIENT_CLEARANCE"
        : "AUTH_REQUIRED",
      requiredTier,
      currentTier: identity.tier,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}
