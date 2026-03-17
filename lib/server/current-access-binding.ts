// lib/server/current-access-binding.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/options";
import { logger } from "@/lib/logging";
import {
  TIER_ORDER,
  type AccessTier,
  normalizeUserTier,
  hasAccess,
} from "@/lib/access/tier-policy";

// Define proper types for the AOL session extension
interface AOLSessionExtension {
  aol?: {
    sessionId?: string;
    memberId?: string;
    tier?: AccessTier | string;
    [key: string]: unknown;
  };
  user?: {
    id?: string;
    email?: string;
    name?: string;
    tier?: AccessTier | string;
    [key: string]: unknown;
  };
}

// Extended Session type
type ExtendedSession = Session & AOLSessionExtension;

export type CurrentAccessBinding = {
  sessionId: string | null;
  userId: string | null;
  tier: AccessTier | null;
};

// Valid tier values for runtime validation
const VALID_TIERS = new Set<string>(TIER_ORDER);

function sanitizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateTier(tier: unknown): AccessTier | null {
  const tierStr = sanitizeString(tier);
  if (!tierStr) return null;

  const normalized = normalizeUserTier(tierStr);

  if (VALID_TIERS.has(normalized)) {
    return normalized;
  }

  logger.warn(`[AccessBinding] Invalid tier value received: ${tierStr}`);
  return null;
}

/**
 * Extracts access binding from session with proper error handling
 * Designed to work with both Pages Router and App Router
 */
export async function getCurrentAccessBinding(
  req: NextApiRequest | Request,
  res?: NextApiResponse,
): Promise<CurrentAccessBinding> {
  try {
    let session: ExtendedSession | null = null;

    if (res) {
      session = await getServerSession(
        req as NextApiRequest,
        res,
        authOptions,
      ) as ExtendedSession | null;
    } else {
      session = await getServerSession(authOptions) as ExtendedSession | null;
    }

    if (!session) {
      return {
        sessionId: null,
        userId: null,
        tier: null,
      };
    }

    const aolSession = session.aol;
    const user = session.user;

    const sessionId =
      sanitizeString(aolSession?.sessionId) ??
      sanitizeString(aolSession?.memberId) ??
      null;

    const userId = sanitizeString(user?.id) ?? null;

    const tier =
      validateTier(aolSession?.tier) ??
      validateTier(user?.tier) ??
      null;

    if (process.env.NODE_ENV === "development") {
      logger.debug(
        `[AccessBinding] Bound: user=${userId}, tier=${tier}, session=${sessionId}`,
      );
    }

    return {
      sessionId,
      userId,
      tier,
    };
  } catch (error) {
    // ✅ FIX 1: Pass error as object, not raw error
    logger.error("[AccessBinding] Failed to get access binding", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      sessionId: null,
      userId: null,
      tier: null,
    };
  }
}

/**
 * App Router compatible version (simpler interface)
 */
export async function getCurrentAccessBindingApp(): Promise<CurrentAccessBinding> {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null;

    if (!session) {
      return {
        sessionId: null,
        userId: null,
        tier: null,
      };
    }

    return {
      sessionId:
        sanitizeString(session.aol?.sessionId) ??
        sanitizeString(session.aol?.memberId) ??
        null,
      userId: sanitizeString(session.user?.id) ?? null,
      tier:
        validateTier(session.aol?.tier) ??
        validateTier(session.user?.tier) ??
        null,
    };
  } catch (error) {
    // ✅ FIX 2: Pass error as object, not raw error
    logger.error("[AccessBinding] App Router binding failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      sessionId: null,
      userId: null,
      tier: null,
    };
  }
}

/**
 * Helper to check if user has required tier access
 */
export function hasRequiredTier(
  binding: CurrentAccessBinding,
  requiredTier: AccessTier,
): boolean {
  if (!binding.tier) {
    return requiredTier === "public";
  }

  return hasAccess(binding.tier, requiredTier);
}