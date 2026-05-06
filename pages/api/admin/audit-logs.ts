/* pages/api/admin/audit-logs.ts — SECURE LOG RETRIEVAL */
import type { NextApiRequest, NextApiResponse } from "next";
import { auditLogger } from "@/lib/audit/audit-logger";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-audit-logs" });
  if (!session) return;

  try {
    const logs = await auditLogger.query({ limit: 100 });
    return res.status(200).json({ logs });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR] Retrieval Failure:", error);
    return res.status(500).json({ error: "Database Retrieval Failure" });
  }
}
