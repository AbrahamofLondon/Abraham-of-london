import type { NextApiRequest, NextApiResponse } from "next";
import { getPrivacySafeStats, getPrivacySafeKeyExport } from "@/lib/inner-circle";

type AdminStatsResponse = {
  ok: boolean;
  stats?: any;
  rows?: any[];
  generatedAt?: string;
  error?: string;
};

function isAdmin(req: NextApiRequest): boolean {
  const raw =
    (req.headers["x-inner-circle-admin-key"] as string | undefined) ||
    (req.headers["authorization"] as string | undefined);

  const token = raw?.replace(/^Bearer\s+/i, "").trim();
  const expected = process.env.INNER_CIRCLE_ADMIN_KEY;

  return !!token && !!expected && token === expected;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AdminStatsResponse>) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ ok: false, error: "Method requires GET or POST." });
  }

  if (!isAdmin(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized. Admin key required." });
  }

  res.setHeader("Cache-Control", "private, max-age=60");

  try {
    const [stats, rows] = await Promise.all([
      getPrivacySafeStats(),
      getPrivacySafeKeyExport ? getPrivacySafeKeyExport() : Promise.resolve([]),
    ]);

    return res.status(200).json({
      ok: true,
      stats,
      rows,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[InnerCircle] admin stats error:", e);
    return res.status(500).json({ ok: false, error: "Telemetry subsystem failure." });
  }
}