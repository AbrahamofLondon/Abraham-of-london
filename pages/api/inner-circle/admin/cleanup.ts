// pages/api/inner-circle/admin/cleanup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { cleanupOldData, type CleanupResult } from "@/lib/inner-circle";

/* =============================================================================
   TYPES
   ============================================================================= */

type CleanupApiResponse =
  | {
      ok: true;
      message: string;
      stats: {
        deletedMembers: number;
        deletedKeys: number;
      };
      meta?: {
        remainingTotal?: number;
      };
      cleanedAt: string;
    }
  | {
      ok: false;
      error: string;
      details?: string;
    };

/* =============================================================================
   CONSTANTS
   ============================================================================= */

const RATE_LIMIT_CONFIG = {
  maxRequests: 3,
  windowSeconds: 3600, // 1 hour
} as const;

const ADMIN_KEY_HEADERS = [
  "x-inner-circle-admin-key",
  "authorization",
] as const;

/* =============================================================================
   UTILITIES
   ============================================================================= */

function getClientIp(req: NextApiRequest): string {
  const xForwardedFor = req.headers["x-forwarded-for"];
  
  if (typeof xForwardedFor === "string") {
    return xForwardedFor.split(",")[0].trim();
  }
  
  if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    return xForwardedFor[0].split(",")[0].trim();
  }
  
  return req.socket?.remoteAddress ?? "unknown";
}

function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function isAdminAuthenticated(req: NextApiRequest): boolean {
  const adminKey = process.env.INNER_CIRCLE_ADMIN_KEY;
  
  if (!adminKey) {
    console.error("[AdminAuth] INNER_CIRCLE_ADMIN_KEY not configured");
    return false;
  }

  for (const headerName of ADMIN_KEY_HEADERS) {
    const headerValue = req.headers[headerName];
    
    if (typeof headerValue === "string") {
      const token = extractBearerToken(headerValue) ?? headerValue.trim();
      
      if (token && token === adminKey) {
        return true;
      }
    }
  }

  return false;
}

/* =============================================================================
   RATE LIMITING
   ============================================================================= */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(
  key: string,
  maxRequests: number = RATE_LIMIT_CONFIG.maxRequests,
  windowSeconds: number = RATE_LIMIT_CONFIG.windowSeconds
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;
  
  const entry = rateLimitStore.get(key);
  
  // Entry doesn't exist or has expired
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = { count: 1, resetAt };
    rateLimitStore.set(key, newEntry);
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }
  
  // Entry exists and is within window
  entry.count += 1;
  rateLimitStore.set(key, entry);
  
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  
  return { allowed, remaining, resetAt: entry.resetAt };
}

function setRateLimitHeaders(
  res: NextApiResponse,
  remaining: number,
  resetAt: number
): void {
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_CONFIG.maxRequests.toString());
  res.setHeader("X-RateLimit-Remaining", remaining.toString());
  res.setHeader("X-RateLimit-Reset", Math.floor(resetAt / 1000).toString());
}

/* =============================================================================
   MAIN HANDLER
   ============================================================================= */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupApiResponse>
): Promise<void> {
  // Method validation
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({
      ok: false,
      error: "Method Not Allowed",
      details: "Maintenance operations require POST method",
    });
    return;
  }

  // Authentication
  if (!isAdminAuthenticated(req)) {
    res.status(401).json({
      ok: false,
      error: "Unauthorized",
      details: "Valid admin key required for this operation",
    });
    return;
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  const rateLimitKey = `inner-circle-cleanup:${clientIp}`;
  
  const rateLimitResult = checkRateLimit(
    rateLimitKey,
    RATE_LIMIT_CONFIG.maxRequests,
    RATE_LIMIT_CONFIG.windowSeconds
  );
  
  setRateLimitHeaders(res, rateLimitResult.remaining, rateLimitResult.resetAt);
  
  if (!rateLimitResult.allowed) {
    res.status(429).json({
      ok: false,
      error: "Too Many Requests",
      details: `Cleanup operations limited to ${RATE_LIMIT_CONFIG.maxRequests} per hour`,
    });
    return;
  }

  // Execute cleanup
  try {
    const result = await cleanupOldData();
    
    console.log(`[Cleanup] Successfully deleted ${result.deletedMembers} members and ${result.deletedKeys} keys`);
    
    const response: CleanupApiResponse = {
      ok: true,
      message: "Vault hygiene completed successfully",
      stats: {
        deletedMembers: result.deletedMembers,
        deletedKeys: result.deletedKeys,
      },
      cleanedAt: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("[Cleanup] Operation failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      ok: false,
      error: "Cleanup operation failed",
      details: errorMessage,
    });
  }
}

/* =============================================================================
   CONFIGURATION
   ============================================================================= */

export const config = {
  api: {
    bodyParser: false, // No body needed for cleanup operations
  },
};