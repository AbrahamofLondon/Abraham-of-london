// pages/api/admin/inner-circle/export.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { exportInnerCircleAdminSummary } from "@/lib/innerCircleMembership";

type AdminExportRow = {
  created_at: string;
  status: "active" | "revoked";
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
};

type AdminResponse =
  | { ok: true; rows: AdminExportRow[] }
  | { ok: false; error: string };

const ADMIN_BEARER_TOKEN = process.env.INNER_CIRCLE_ADMIN_TOKEN;

/**
 * Simple token-based protection for admin export.
 * Call with:
 *   Authorization: Bearer <INNER_CIRCLE_ADMIN_TOKEN>
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminResponse>,
): void {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!ADMIN_BEARER_TOKEN) {
    res.status(500).json({
      ok: false,
      error: "Admin export is not configured (missing token).",
    });
    return;
  }

  const authHeader = req.headers.authorization ?? "";
  const token =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

  if (!token || token !== ADMIN_BEARER_TOKEN) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const rows = exportInnerCircleAdminSummary();
  res.status(200).json({ ok: true, rows });
}