import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { getLinkedInAppProfileDiagnostics } from "@/lib/integrations/linkedin/linkedin-app-profile";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  return res.status(200).json({
    ok: true,
    diagnostics: getLinkedInAppProfileDiagnostics(),
  });
}
