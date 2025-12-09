// pages/api/admin/inner-circle/export.ts - Inline stub
import type { NextApiRequest, NextApiResponse } from "next";

type AdminExportRow = {
  created_at: string;
  status: "active" | "revoked";
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
};

// Stub function
const exportInnerCircleAdminSummary = async (): Promise<AdminExportRow[]> => {
  console.log("Stub: exportInnerCircleAdminSummary called");
  return [];
};

const ADMIN_BEARER_TOKEN = process.env.INNER_CIRCLE_ADMIN_TOKEN;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: boolean; rows: AdminExportRow[] } | { ok: false; error: string }>
) {
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

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ ok: false, error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.substring(7);
  if (token !== ADMIN_BEARER_TOKEN) {
    res.status(401).json({ ok: false, error: "Invalid token" });
    return;
  }

  try {
    const rows = await exportInnerCircleAdminSummary();
    res.status(200).json({ ok: true, rows });
  } catch (error) {
    console.error("Error exporting inner circle:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
