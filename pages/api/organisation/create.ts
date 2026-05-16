/**
 * pages/api/organisation/create.ts
 *
 * Creates a new organisation.
 *
 * POST /api/organisation/create
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { createOrganisation } from "@/lib/product/organisation-lite";

type Response =
  | { ok: true; organisation: { organisationId: string; organisationName: string; memberCount: number; seatAllowance: number } }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  const { name, slug } = req.body as { name?: string; slug?: string };
  if (!name || !slug) {
    return res.status(400).json({ ok: false, error: "Name and slug are required" });
  }

  try {
    const org = await createOrganisation({
      name,
      slug,
      ownerEmail: identity.email,
      ownerUserId: identity.subjectId,
    });

    return res.status(200).json({
      ok: true,
      organisation: {
        organisationId: org.organisationId,
        organisationName: org.organisationName,
        memberCount: org.memberCount,
        seatAllowance: org.seatAllowance,
      },
    });
  } catch (error) {
    console.error("[organisation/create]", error);
    return res.status(500).json({ ok: false, error: "Failed to create organisation" });
  }
}
