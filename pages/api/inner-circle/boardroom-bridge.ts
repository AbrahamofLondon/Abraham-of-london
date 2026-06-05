/* pages/api/inner-circle/boardroom-bridge.ts — P0: Boardroom Brief bridge from Inner Circle */
/* Creates a safe handoff record, records BOARDROOM_CLICKED, returns handoff-based redirect URL */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

type Response = {
  ok: boolean;
  redirectUrl?: string;
  error?: string;
};

function id(prefix: string): string {
  const crypto = require("crypto");
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return res.status(401).json({ ok: false, error: "AUTH_REQUIRED" });
  }

  const { diagnosticId } = req.body || {};

  try {
    let riskLevel: string | null = null;
    let score: number | null = null;

    // If diagnosticId provided, verify and get context
    if (diagnosticId) {
      const diagnostic = await prisma.$queryRaw<Array<{ id: string; user_id: string; risk_level: string; score: number }>>`
        SELECT id, user_id, risk_level, score
        FROM inner_circle_diagnostic_results
        WHERE id = ${diagnosticId}
        LIMIT 1
      `;

      if (!diagnostic[0] || diagnostic[0].user_id !== userId) {
        return res.status(404).json({ ok: false, error: "DIAGNOSTIC_NOT_FOUND" });
      }

      riskLevel = diagnostic[0].risk_level;
      score = diagnostic[0].score;

      // Record BOARDROOM_CLICKED in advisory qualifications
      const existingQual = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM inner_circle_advisory_qualifications
        WHERE user_id = ${userId}
          AND trigger_result_id = ${diagnosticId}
          AND status IN ('OPEN', 'BOARDROOM_RECOMMENDED')
        LIMIT 1
      `;

      if (existingQual[0]) {
        await prisma.$executeRaw`
          UPDATE inner_circle_advisory_qualifications
          SET status = 'BOARDROOM_CLICKED', updated_at = NOW()
          WHERE id = ${existingQual[0].id}
        `;
      } else {
        const qualId = id("icaq");
        await prisma.$executeRaw`
          INSERT INTO inner_circle_advisory_qualifications (
            id, user_id, trigger_result_id, status, risk_level, recommended_product, reason, metadata_json, created_at, updated_at
          )
          VALUES (
            ${qualId},
            ${userId},
            ${diagnosticId},
            'BOARDROOM_CLICKED',
            ${riskLevel},
            'boardroom-brief',
            'User clicked through to Boardroom Brief from Inner Circle diagnostic result',
            ${JSON.stringify({ score, source: "inner-circle-bridge" })}::jsonb,
            NOW(),
            NOW()
          )
        `;
      }
    }

    // Create safe handoff record (no raw text in URL)
    const handoffId = id("bh");
    const expiresAt = new Date(Date.now() + 3600_000); // 1 hour expiry

    await prisma.$executeRaw`
      INSERT INTO boardroom_bridge_handoffs (id, user_id, diagnostic_id, risk_level, recommended_route, expires_at, created_at)
      VALUES (${handoffId}, ${userId}, ${diagnosticId || null}, ${riskLevel}, 'boardroom-brief', ${expiresAt}, NOW())
    `;

    // Build safe redirect URL with only handoff ID (no raw text)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
    const redirectUrl = `${siteUrl}/boardroom-brief?handoff=${handoffId}`;

    return res.status(200).json({ ok: true, redirectUrl });
  } catch (error) {
    console.error("[boardroom-bridge]", error);
    return res.status(500).json({ ok: false, error: "BRIDGE_FAILED" });
  }
}