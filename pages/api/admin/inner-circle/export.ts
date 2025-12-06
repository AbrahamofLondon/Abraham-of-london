import type { NextApiRequest, NextApiResponse } from "next";
import { 
  rateLimit, 
  createRateLimitHeaders, 
  RATE_LIMIT_CONFIGS 
} from "@/lib/server/rateLimit";
import { exportInnerCircleAdminSummary } from "@/lib/innerCircleMembership";

type AdminExportResponse = {
  ok: boolean;
  data?: any[];
  error?: string;
  message?: string;
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

function logExport(action: string, meta: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log(`[InnerCircle:Export] ${action}`, {
    ts: new Date().toISOString(),
    ...meta,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminExportResponse>
): Promise<void> {
  if (req.method !== "GET") {
    logExport("method_not_allowed", { method: req.method });
    res.setHeader("Allow", "GET");
    res.status(405).json({ 
      ok: false, 
      error: "Method not allowed. Use GET." 
    });
    return;
  }

  // Authentication
  if (!isAuthorized(req)) {
    logExport("unauthorized_access", { 
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
    `admin-export:${req.headers["x-forwarded-for"]?.toString().split(",")[0] || "unknown"}`,
    RATE_LIMIT_CONFIGS.ADMIN_OPERATIONS
  );
  const rlHeaders = createRateLimitHeaders(rl);
  Object.entries(rlHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (!rl.allowed) {
    logExport("rate_limited");
    res.status(429).json({ 
      ok: false, 
      error: "Too many admin requests. Please try again later." 
    });
    return;
  }

  try {
    logExport("starting");
    
    const data = await exportInnerCircleAdminSummary();
    
    logExport("completed", { recordCount: data.length });
    
    res.status(200).json({
      ok: true,
      data,
      message: `Successfully exported ${data.length} records.`
    });
  } catch (err) {
    logExport("error", {
      error: err instanceof Error ? err.message : "unknown"
    });
    
    res.status(500).json({
      ok: false,
      error: "Failed to export data. Check server logs for details."
    });
  }
}