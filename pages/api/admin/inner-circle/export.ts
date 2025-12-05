// pages/api/admin/inner-circle/export.ts
import type { NextApiRequest, NextApiResponse } from "next";

type AdminExportResponse = {
  ok: boolean;
  error?: string;
};

const ADMIN_API_KEY = process.env.INNER_CIRCLE_ADMIN_KEY ?? "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminExportResponse>
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (
    !ADMIN_API_KEY ||
    req.headers["x-inner-circle-admin-key"] !== ADMIN_API_KEY
  ) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  // Temporary stub: real export logic disabled to keep build stable.
  res.status(501).json({
    ok: false,
    error: "Inner Circle admin export is disabled in this environment.",
  });
}