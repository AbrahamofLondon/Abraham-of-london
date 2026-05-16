import type { NextApiRequest, NextApiResponse } from "next";

import { loadSharedCaseByToken } from "@/lib/product/case-sharing";
import { CASE_SHARE_BOUNDARY_NOTE } from "@/lib/product/case-sharing-contract";

type Response =
  | {
      ok: true;
      exportedAt: string;
      sharedCase: NonNullable<Awaited<ReturnType<typeof loadSharedCaseByToken>>["view"]>;
      boundaryNote: string;
    }
  | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    return res.status(400).json({ ok: false, error: "token is required" });
  }

  const result = await loadSharedCaseByToken(token);
  if (result.state !== "ACTIVE" || !result.view || !result.share) {
    return res.status(404).json({ ok: false, error: "Shared case unavailable" });
  }
  if (!result.view.canExport) {
    return res.status(403).json({ ok: false, error: "Export is not enabled for this shared view" });
  }

  res.setHeader("Content-Disposition", `attachment; filename="shared-case-${result.view.caseRef}.json"`);
  return res.status(200).json({
    ok: true,
    exportedAt: new Date().toISOString(),
    sharedCase: result.view,
    boundaryNote: CASE_SHARE_BOUNDARY_NOTE,
  });
}
