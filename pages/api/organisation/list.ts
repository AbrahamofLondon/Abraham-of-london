/**
 * pages/api/organisation/list.ts
 *
 * Lists organisations for the authenticated user.
 *
 * GET /api/organisation/list
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { getUserOrganisations, type OrgLiteSummary } from "@/lib/product/organisation-lite";

type Response =
  | { ok: true; organisations: OrgLiteSummary[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  try {
    const organisations = await getUserOrganisations(identity.email);
    return res.status(200).json({ ok: true, organisations });
  } catch (error) {
    console.error("[organisation/list]", error);
    return res.status(500).json({ ok: false, error: "Failed to list organisations" });
  }
}
