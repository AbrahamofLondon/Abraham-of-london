// pages/api/admin/inner-circle/export.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  exportInnerCircleAdminSummary,
  type InnerCircleAdminExportRow,
} from "@/lib/innerCircleMembership";

type AdminExportResponse =
  | { ok: true; rows: InnerCircleAdminExportRow[] }
  | { ok: false; error: string };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminExportResponse>,
): void {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const rows = exportInnerCircleAdminSummary();
    res.status(200).json({ ok: true, rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[InnerCircle Admin Export] Error:", error);
    res
      .status(500)
      .json({ ok: false, error: "Failed to generate Inner Circle export." });
  }
}