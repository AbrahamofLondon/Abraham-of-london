import type { NextApiRequest, NextApiResponse } from "next";
import innerCircleStore, { type PrivacySafeKeyRow } from "@/lib/server/inner-circle-store";

type PrivacySafeStats = { 
  totalMembers: number; 
  totalKeys: number; 
  activeKeys: number;
  revokedKeys: number;
  expiredKeys: number;
  avgUnlocksPerKey: number;
  lastCleanup: string | null;
};

type AdminStatsResponse =
  | {
      ok: true;
      stats: PrivacySafeStats;
      keyRows: PrivacySafeKeyRow[];
      generatedAt: string;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }
  | { 
      ok: false; 
      error: string;
      details?: string;
    };

function isAdmin(req: NextApiRequest): boolean {
  const raw =
    (req.headers["x-inner-circle-admin-key"] as string | undefined) ||
    (req.headers["authorization"] as string | undefined);

  if (!raw) return false;

  const token = raw.replace(/^Bearer\s+/i, "").trim();
  const expected = process.env.INNER_CIRCLE_ADMIN_KEY;

  if (!expected) {
    console.error("[AdminStats] INNER_CIRCLE_ADMIN_KEY not configured");
    return false;
  }

  return token === expected;
}

function validatePaginationParams(req: NextApiRequest): {
  page: number;
  limit: number;
} {
  const pageParam = req.query.page;
  const limitParam = req.query.limit;

  let page = 1;
  let limit = 50;

  if (pageParam) {
    const parsedPage = parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam, 10);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage;
    }
  }

  if (limitParam) {
    const parsedLimit = parseInt(Array.isArray(limitParam) ? limitParam[0] : limitParam, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 1000) {
      limit = parsedLimit;
    }
  }

  return { page, limit };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminStatsResponse>
) {
  // Method validation
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ 
      ok: false, 
      error: "Method Not Allowed",
      details: "Only GET method is supported for statistics"
    });
  }

  // Admin authentication
  if (!isAdmin(req)) {
    console.warn("[AdminStats] Unauthorized access attempt");
    return res.status(401).json({ 
      ok: false, 
      error: "Unauthorized",
      details: "Valid admin key required"
    });
  }

  // Cache control
  res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    // Get pagination parameters
    const { page, limit } = validatePaginationParams(req);
    
    // Fetch statistics and key rows in parallel
    const [statsResult, keyRowsResult] = await Promise.all([
      innerCircleStore.getPrivacySafeStats(),
      innerCircleStore.getPrivacySafeKeyRows({ page, limit })
    ]);

    // Type guard to ensure statsResult is the right type
    const stats: PrivacySafeStats = {
      totalMembers: statsResult.totalMembers || 0,
      totalKeys: statsResult.totalKeys || 0,
      activeKeys: statsResult.activeKeys || 0,
      revokedKeys: statsResult.revokedKeys || 0,
      expiredKeys: statsResult.expiredKeys || 0,
      avgUnlocksPerKey: statsResult.avgUnlocksPerKey || 0,
      lastCleanup: statsResult.lastCleanup || null,
    };

    return res.status(200).json({
      ok: true,
      stats,
      keyRows: keyRowsResult.data,
      generatedAt: new Date().toISOString(),
      pagination: {
        page: keyRowsResult.pagination.page,
        limit: keyRowsResult.pagination.limit,
        total: keyRowsResult.pagination.total,
        totalPages: keyRowsResult.pagination.totalPages,
      }
    });

  } catch (error) {
    console.error("[AdminStats] Error fetching statistics:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error occurred";
    
    return res.status(500).json({ 
      ok: false, 
      error: "Failed to fetch statistics",
      details: errorMessage
    });
  }
}

// API configuration
export const config = {
  api: {
    bodyParser: false, // No body needed for GET requests
  },
};