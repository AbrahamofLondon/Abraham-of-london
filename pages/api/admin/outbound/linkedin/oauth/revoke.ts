import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { isLinkedInAppProfileKey } from "@/lib/integrations/linkedin/linkedin-app-profile";
import { revokeLinkedInConnection } from "@/lib/outbound/linkedin-oauth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const profile =
    typeof req.query.profile === "string" && isLinkedInAppProfileKey(req.query.profile)
      ? req.query.profile
      : undefined;
  await revokeLinkedInConnection(profile);
  return res.status(200).json({ ok: true, message: "LinkedIn connection revoked locally." });
}
