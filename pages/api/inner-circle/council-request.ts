/* pages/api/inner-circle/council-request.ts — P2: Private Council Intake API */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

type Response = { ok: true } | { ok: false; error: string };

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

  const { name, email, organisation, governanceCategory, urgency, preferredNextStep, diagnosticCount, latestRiskLevel } = req.body || {};

  if (!name || !email || !governanceCategory || !urgency) {
    return res.status(400).json({ ok: false, error: "REQUIRED_FIELDS_MISSING" });
  }

  try {
    // Store the council request in the advisory qualifications table
    const id = `cr_${require("crypto").randomUUID().replace(/-/g, "")}`;

    await prisma.$executeRaw`
      INSERT INTO inner_circle_advisory_qualifications (
        id, user_id, trigger_result_id, status, risk_level, recommended_product, reason, metadata_json, created_at, updated_at
      )
      VALUES (
        ${id},
        ${userId},
        NULL,
        'COUNCIL_REQUESTED',
        ${latestRiskLevel || "Unknown"},
        'private-council',
        'Private Council review requested by member',
        ${JSON.stringify({
          name,
          email,
          organisation: organisation || null,
          governanceCategory,
          urgency,
          preferredNextStep: preferredNextStep || null,
          diagnosticCount,
          source: "council-request-form",
        })}::jsonb,
        NOW(),
        NOW()
      )
    `;

    // Update the profile access state
    await prisma.$executeRaw`
      UPDATE inner_circle_profiles
      SET access_state = 'Council Candidate', updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[council-request]", error);
    return res.status(500).json({ ok: false, error: "REQUEST_FAILED" });
  }
}
