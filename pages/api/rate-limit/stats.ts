// pages/api/admin/rate-limit/stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getRateLimiterStats,
  resetRateLimit,
  unblock,
  type RateLimitKey,
} from "@/lib/server/rate-limit-unified";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // TODO: Add admin authentication here
  // if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const stats = await getRateLimiterStats();
    return res.status(200).json(stats);
  }

  if (req.method === "POST") {
    const { action, key, id } = req.body ?? {};

    if (!key || typeof key !== "string") {
      return res.status(400).json({ error: "Key required" });
    }

    switch (action) {
      case "reset": {
        // The key needs to be a valid RateLimitKey
        // You might need to map from the format shown in stats to the RateLimitKey type
        let rateLimitKey: RateLimitKey;
        
        // Handle different possible key formats from the stats
        if (key.includes(':')) {
          // If it's a compound key like "api-strict:some-id", extract the prefix part
          const prefix = key.split(':')[0];
          // Map the prefix to a RateLimitKey
          switch (prefix) {
            case 'pub': rateLimitKey = 'PUBLIC'; break;
            case 'auth': rateLimitKey = 'AUTH'; break;
            case 'admin': rateLimitKey = 'ADMIN'; break;
            case 'api-strict': rateLimitKey = 'API_STRICT'; break;
            case 'api': rateLimitKey = 'API_GENERAL'; break;
            case 'ic-unlock': rateLimitKey = 'INNER_CIRCLE_UNLOCK'; break;
            case 'contact': rateLimitKey = 'CONTACT'; break;
            case 'download': rateLimitKey = 'DOWNLOAD'; break;
            default: rateLimitKey = 'API_GENERAL'; // fallback
          }
        } else {
          // If it's just the key name, try to use it directly if it's a valid RateLimitKey
          // This is a type assertion - you might want validation
          rateLimitKey = key as RateLimitKey;
        }

        const resetSuccess = await resetRateLimit({
          key: rateLimitKey,
          id: id || "api", // Use provided id or default
        });

        return res.status(200).json({
          success: resetSuccess,
          message: resetSuccess ? "Rate limit reset" : "Key not found",
        });
      }

      case "unblock": {
        // unblock is aliased to resetRateLimit, so it needs the same parameters
        let rateLimitKey: RateLimitKey;
        
        if (key.includes(':')) {
          const prefix = key.split(':')[0];
          switch (prefix) {
            case 'pub': rateLimitKey = 'PUBLIC'; break;
            case 'auth': rateLimitKey = 'AUTH'; break;
            case 'admin': rateLimitKey = 'ADMIN'; break;
            case 'api-strict': rateLimitKey = 'API_STRICT'; break;
            case 'api': rateLimitKey = 'API_GENERAL'; break;
            case 'ic-unlock': rateLimitKey = 'INNER_CIRCLE_UNLOCK'; break;
            case 'contact': rateLimitKey = 'CONTACT'; break;
            case 'download': rateLimitKey = 'DOWNLOAD'; break;
            default: rateLimitKey = 'API_GENERAL';
          }
        } else {
          rateLimitKey = key as RateLimitKey;
        }

        await unblock({
          key: rateLimitKey,
          id: id || "api",
        });

        return res.status(200).json({
          success: true,
          message: "Key unblocked",
        });
      }

      default:
        return res.status(400).json({ error: "Invalid action" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}