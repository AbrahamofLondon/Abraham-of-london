/**
 * pages/api/trial/resolve-expiry.ts
 *
 * POST /api/trial/resolve-expiry
 * Body: { selectedCaseIds?: string[] }
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { resolveExpiredTrialSelection } from "@/lib/product/trial-expiry-service";

const schema = z.object({
  selectedCaseIds: z.array(z.string().min(1)).max(3).optional().default([]),
});

type Response =
  | { ok: true; state: Awaited<ReturnType<typeof resolveExpiredTrialSelection>> }
  | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid request body" });
  }

  try {
    const state = await resolveExpiredTrialSelection({
      email: identity.email,
      selectedCaseIds: parsed.data.selectedCaseIds,
    });
    return res.status(200).json({ ok: true, state });
  } catch (error) {
    console.error("[trial/resolve-expiry]", error);
    return res.status(500).json({ ok: false, error: "Could not resolve trial expiry" });
  }
}
