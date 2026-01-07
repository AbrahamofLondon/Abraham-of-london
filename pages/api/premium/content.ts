// pages/api/premium/content.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { withInnerCircleAccess } from "@/lib/server/inner-circle-access";

/**
 * NOTE:
 * - This file assumes Node.js runtime (not Edge).
 * - If you *must* run on Edge, replace crypto usage with WebCrypto and remove Buffer.
 */

// Premium content data (placeholder)
const PREMIUM_CONTENT = {
  exclusiveReports: [
    {
      id: "report-001",
      title: "Global Market Intelligence Report Q4 2024",
      description: "Exclusive analysis of global market movements and predictions",
      content: "Detailed report content...",
      category: "market-intelligence",
      accessLevel: "premium",
      confidentialLevel: "high",
      fileSize: "15.2 MB",
      pages: 42,
      publishedDate: "2024-01-15",
      expiresAt: "2024-06-15",
      tags: ["global", "intelligence", "quarterly", "exclusive"],
    },
    {
      id: "report-002",
      title: "Industry Disruption Analysis: Tech Sector",
      description: "In-depth analysis of upcoming disruptions in technology",
      content: "Detailed report content...",
      category: "industry-analysis",
      accessLevel: "premium",
      confidentialLevel: "medium",
      fileSize: "8.7 MB",
      pages: 28,
      publishedDate: "2024-01-10",
      tags: ["tech", "disruption", "analysis", "forecast"],
    },
  ],
  masterclasses: [
    {
      id: "masterclass-001",
      title: "Advanced Negotiation Strategies",
      instructor: "Dr. Sarah Chen",
      duration: "3h 15m",
      modules: 8,
      releaseDate: "2024-01-20",
      accessLevel: "premium",
      materials: ["workbook", "templates", "case-studies"],
    },
  ],
  tools: [
    {
      id: "tool-001",
      name: "Strategic Decision Matrix Pro",
      description: "Advanced decision-making framework tool",
      version: "2.1.0",
      lastUpdated: "2024-01-12",
      accessLevel: "premium",
    },
  ],
};

const PREMIUM_RATE_LIMIT_CONFIG = {
  windowMs: 5 * 60 * 1000,
  max: 100, // IMPORTANT: align with your RateLimitConfig (max, not limit)
  keyPrefix: "premium_api",
};

// ---- helpers: query normalization ----
function q1(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function jsonError(res: NextApiResponse, status: number, body: Record<string, any>) {
  return res.status(status).json({ success: false, ...body });
}

// ---- security: premium access verification ----
// Replace this with DB lookup in production (user id -> tier).
async function verifyPremiumAccess(req: NextApiRequest): Promise<{
  isValid: boolean;
  tier?: string;
  joinedDate?: string;
}> {
  /**
   * DO NOT trust raw cookies like premiumAccess=true.
   * If you must use cookies, they must be signed and validated server-side.
   *
   * Minimal approach: signed cookie "premium" = `${payload}.${sig}`
   */
  const token = req.cookies?.premium; // e.g. "tier=premium_plus&since=2024-01-01&exp=... . <sig>"
  if (!token) return { isValid: false };

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return { isValid: false };

  const secret = process.env.PREMIUM_COOKIE_SECRET;
  if (!secret) return { isValid: false }; // fail closed

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return { isValid: false };

  // Parse payload
  const params = new URLSearchParams(payload);
  const tier = params.get("tier") || undefined;
  const joinedDate = params.get("since") || undefined;
  const exp = params.get("exp");
  if (exp && Date.now() > Number(exp)) return { isValid: false };

  return { isValid: true, tier, joinedDate };
}

// ---- security: download token ----
function generateDownloadToken(reportId: string, ttlMs = 15 * 60 * 1000): string {
  const secret = process.env.DOWNLOAD_SECRET;
  if (!secret) throw new Error("Missing DOWNLOAD_SECRET");

  const exp = Date.now() + ttlMs;
  const payload = `${reportId}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

function trackDownload(ip: string | undefined, reportId: string): void {
  const safeIp = ip ? ip.replace(/\.\d+$/, ".x") : "unknown";
  console.log(`[PREMIUM DOWNLOAD] ip=${safeIp} report=${reportId} at=${new Date().toISOString()}`);
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const access = (req as any).innerCircleAccess;
    const method = req.method || "GET";

    const contentType = q1(req.query.contentType);
    const id = q1(req.query.id);
    const action = q1(req.query.action);

    // disciplined logging
    if (process.env.NODE_ENV !== "test") {
      console.log(`[PREMIUM CONTENT API] ${method}`, {
        ip: access?.userData?.ip ? String(access.userData.ip).replace(/\.\d+$/, ".x") : "unknown",
        contentType,
        id,
        action,
        ts: new Date().toISOString(),
      });
    }

    const premiumAccess = await verifyPremiumAccess(req);
    if (!premiumAccess.isValid) {
      return jsonError(res, 403, {
        error: "Premium Access Required",
        message: "This endpoint requires a premium subscription level.",
        code: "PREMIUM_REQUIRED",
        upgradeUrl: "/inner-circle/upgrade",
      });
    }

    // --- routing ---
    switch (method) {
      case "GET": {
        if (!contentType) {
          return jsonError(res, 400, {
            error: "Missing content type",
            message: "Provide ?contentType=reports|masterclasses|tools|dashboard",
          });
        }

        if (contentType === "reports") {
          if (id) {
            const report = PREMIUM_CONTENT.exclusiveReports.find((r) => r.id === id);
            if (!report) {
              return jsonError(res, 404, {
                error: "Report not found",
                message: `No premium report found with ID: ${id}`,
              });
            }

            if (isExpired(report.expiresAt)) {
              return jsonError(res, 410, {
                error: "Report expired",
                message: "This report is no longer available.",
                expiredAt: report.expiresAt,
              });
            }

            // NOTE: do NOT hand out download tokens on GET.
            return res.status(200).json({
              success: true,
              contentType: "report",
              data: {
                ...report,
                content: report.content.substring(0, 500) + "...",
              },
              metadata: {
                premiumTier: premiumAccess.tier,
                accessedAt: new Date().toISOString(),
              },
            });
          }

          // list reports
          const page = Number(q1(req.query.page) || "1");
          const limit = Number(q1(req.query.limit) || "5");
          const category = q1(req.query.category);
          const sortBy = q1(req.query.sortBy) || "publishedDate";

          let filtered = PREMIUM_CONTENT.exclusiveReports.filter((r) => !isExpired(r.expiresAt));
          if (category) filtered = filtered.filter((r) => r.category === category);

          if (sortBy === "publishedDate") {
            filtered.sort(
              (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
            );
          }

          const start = (Math.max(1, page) - 1) * Math.max(1, limit);
          const paginated = filtered.slice(start, start + Math.max(1, limit));

          return res.status(200).json({
            success: true,
            contentType: "reports",
            data: paginated.map((r) => ({ ...r, content: undefined })),
            pagination: {
              total: filtered.length,
              page: Math.max(1, page),
              limit: Math.max(1, limit),
              totalPages: Math.ceil(filtered.length / Math.max(1, limit)),
            },
            metadata: {
              availableCategories: [...new Set(filtered.map((r) => r.category))],
            },
          });
        }

        if (contentType === "masterclasses") {
          return res.status(200).json({ success: true, contentType, data: PREMIUM_CONTENT.masterclasses });
        }

        if (contentType === "tools") {
          return res.status(200).json({ success: true, contentType, data: PREMIUM_CONTENT.tools });
        }

        if (contentType === "dashboard") {
          return res.status(200).json({
            success: true,
            contentType,
            data: {
              userStats: {
                reportsAccessed: 12,
                masterclassesCompleted: 3,
                toolsUsed: 2,
                memberSince: premiumAccess.joinedDate || "2024-01-01",
              },
            },
          });
        }

        return jsonError(res, 400, {
          error: "Invalid content type",
          message: `Content type '${contentType}' not recognized for premium content`,
        });
      }

      case "POST": {
        // Prefer POST for generating download links (auditable + rate limited)
        if (action === "download") {
          const reportId = req.body?.reportId as string | undefined;
          if (!reportId) {
            return jsonError(res, 400, {
              error: "Report ID required",
              message: "Please specify which report to download.",
            });
          }

          const report = PREMIUM_CONTENT.exclusiveReports.find((r) => r.id === reportId);
          if (!report) {
            return jsonError(res, 404, { error: "Report not found", message: `No report: ${reportId}` });
          }
          if (isExpired(report.expiresAt)) {
            return jsonError(res, 410, { error: "Report expired", message: "This report is no longer available." });
          }

          const token = generateDownloadToken(reportId);
          const downloadUrl = `/api/premium/content/download/${encodeURIComponent(reportId)}?token=${encodeURIComponent(
            token
          )}`;

          trackDownload(access?.userData?.ip, reportId);

          return res.status(200).json({
            success: true,
            message: "Download ready",
            downloadUrl,
            tokenExpiresInSeconds: 15 * 60,
          });
        }

        return jsonError(res, 400, { error: "Invalid action", message: `Action '${action}' not recognized` });
      }

      default: {
        res.setHeader("Allow", ["GET", "POST"]);
        return jsonError(res, 405, {
          error: "Method Not Allowed",
          message: `Method ${method} not supported for premium content`,
        });
      }
    }
  } catch (error: any) {
    console.error("[PREMIUM CONTENT API] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred with premium content.",
      timestamp: new Date().toISOString(),
    });
  }
};

export default withInnerCircleAccess(handler, {
  requireAuth: true,
  rateLimitConfig: PREMIUM_RATE_LIMIT_CONFIG,
});