// netlify/functions_src/functions/cleanup-download-tokens.ts

import { cleanupExpiredDownloadTokens } from "../../../lib/premium/download-token";
import { logger } from "../../../lib/logging";

type NetlifyHandlerEvent = {
  headers: Record<string, string | undefined>;
};

type NetlifyHandlerContext = Record<string, unknown>;

type NetlifyHandlerResponse = {
  statusCode: number;
  body: string;
};

type Handler = (
  event: NetlifyHandlerEvent,
  context: NetlifyHandlerContext,
) => Promise<NetlifyHandlerResponse>;

// Netlify scheduled function configuration
export const handler: Handler = async (event, _context) => {
  const scheduledHeader = event.headers["x-netlify-scheduled"];

  if (scheduledHeader !== "true") {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized - Scheduled function only" }),
    };
  }

  const authHeader = event.headers.authorization;
  const expected = process.env.CRON_SECRET;

  if (expected) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Missing or invalid authorization" }),
      };
    }

    const token = authHeader.slice(7);
    if (token !== expected) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid authorization" }),
      };
    }
  }

  const REQUIRED_DAYS = 7;

  try {
    logger.info("[NETLIFY_CRON] Starting automated token cleanup");

    const startTime = Date.now();
    const deleted = await cleanupExpiredDownloadTokens(REQUIRED_DAYS);
    const duration = Date.now() - startTime;

    logger.info("[NETLIFY_CRON] Automated token cleanup completed", {
      deleted,
      days: REQUIRED_DAYS,
      durationMs: duration,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        deleted,
        days: REQUIRED_DAYS,
        executedAt: new Date().toISOString(),
        durationMs: duration,
        source: "netlify-cron",
      }),
    };
  } catch (error) {
    logger.error("[NETLIFY_CRON] Automated token cleanup failed", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : "Unknown error",
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Cleanup failed",
        code: "CLEANUP_FAILED",
      }),
    };
  }
};