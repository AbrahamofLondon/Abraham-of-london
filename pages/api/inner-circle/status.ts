import type { NextApiRequest, NextApiResponse } from "next";
import innerCircleStore from "@/lib/server/inner-circle-store";

type StatusResponse =
  | {
      ok: true;
      now: string;
      env: {
        nodeEnv: string;
        siteUrl: string | null;
        hasDbUrl: boolean;
      };
      stats: { totalMembers: number; totalKeys: number };
    }
  | { ok: false; now: string; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<StatusResponse>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, now: new Date().toISOString(), error: "Method not allowed" });
  }

  try {
    const stats = await innerCircleStore.getPrivacySafeStats();
    const hasDbUrl = Boolean(process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL);

    return res.status(200).json({
      ok: true,
      now: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV || "unknown",
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
        hasDbUrl,
      },
      stats: {
        totalMembers: stats.totalMembers,
        totalKeys: stats.totalKeys
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      now: new Date().toISOString(),
      error: e?.message || "status_failed",
    });
  }
}
