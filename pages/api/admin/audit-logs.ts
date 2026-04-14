/* pages/api/admin/audit-logs.ts — SECURE LOG RETRIEVAL */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { auditLogger } from "@/lib/audit/audit-logger";

type LegacyUser = {
  role?: string | null;
};

type LegacySession = {
  aol?: {
    tier?: string | null;
  } | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  const user = session?.user;
  const legacyUser = user as LegacyUser | undefined;
  const legacySession = session as LegacySession | null | undefined;

  const isAdmin =
    legacyUser?.role === "ADMIN" ||
    legacyUser?.role === "owner" ||
    legacySession?.aol?.tier === "owner";

  if (!session || !user || !isAdmin) {
    return res.status(403).json({
      error: "Unauthorized. Admin Clearance Required.",
    });
  }

  try {
    const logs = await auditLogger.query({ limit: 100 });
    return res.status(200).json({ logs });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR] Retrieval Failure:", error);
    return res.status(500).json({ error: "Database Retrieval Failure" });
  }
}
