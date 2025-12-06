import type { NextApiRequest, NextApiResponse } from "next";
import { 
  rateLimit, 
  createRateLimitHeaders, 
  RATE_LIMIT_CONFIGS 
} from "@/lib/server/rateLimit";
import { cleanupOldData } from "@/lib/innerCircleMembership";

type CleanupResponse = {
  ok: boolean;
  message?: string;
  stats?: {
    deletedMembers: number;
    deletedKeys: number;
  };
  error?: string;
};

const ADMIN_API_KEY = process.env.INNER_CIRCLE_ADMIN_KEY || "";
const ADMIN_IPS = (process.env.INNER_CIRCLE_ADMIN_IPS || "").split(",").map(ip => ip.trim()).filter(ip => ip);

function isAuthorized(req: NextApiRequest): boolean {
  // Check API key
  const apiKey = req.headers["x-inner-circle-admin-key"];
  if (apiKey === ADMIN_API_KEY && ADMIN_API_KEY.length > 0) {
    return true;
  }

  // Check IP whitelist
  const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0] || 
                   req.socket?.remoteAddress || "";
  if (ADMIN_IPS.length > 0 && ADMIN_IPS.includes(clientIp)) {
    return true;
  }

  return false;
}

function logCleanup(action: string, meta: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log(`[InnerCircle:Cleanup] ${action}`, {
    ts: new Date().toISOString(),
    ...meta,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupResponse>
): Promise<void> {
  if (req.method !== "POST") {
    logCleanup("method_not_allowed", { method: req.method });
    res.setHeader("Allow", "POST");
    res.status(405).json({ 
      ok: false, 
      error: "Method not allowed. Use POST." 
    });
    return;
  }

  // Authentication
  if (!isAuthorized(req)) {
    logCleanup("unauthorized_access", { 
      ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress 
    });
    res.status(401).json({ 
      ok: false, 
      error: "Unauthorized. Admin access required." 
    });
    return;
  }

  // Rate limiting
  const rl = rateLimit(
    `admin-cleanup:${req.headers["x-forwarded-for"]?.toString().split(",")[0] || "unknown"}`,
    RATE_LIMIT_CONFIGS.ADMIN_OPERATIONS
  );
  const rlHeaders = createRateLimitHeaders(rl);
  Object.entries(rlHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (!rl.allowed) {
    logCleanup("rate_limited");
    res.status(429).json({ 
      ok: false, 
      error: "Too many admin requests. Please try again later." 
    });
    return;
  }

  try {
    logCleanup("starting");
    
    const { deletedMembers, deletedKeys } = await cleanupOldData();
    
    logCleanup("completed", { deletedMembers, deletedKeys });
    
    res.status(200).json({
      ok: true,
      message: `Cleanup completed successfully. Removed ${deletedMembers} member(s) and ${deletedKeys} key(s).`,
      stats: { deletedMembers, deletedKeys }
    });
  } catch (err) {
    logCleanup("error", {
      error: err instanceof Error ? err.message : "unknown"
    });
    
    res.status(500).json({
      ok: false,
      error: "Failed to execute cleanup. Check server logs for details."
    });
  }
}