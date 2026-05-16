import type { NextApiRequest, NextApiResponse } from "next";

import { loadSharedCaseByToken } from "@/lib/product/case-sharing";
import {
  verifySharedGovernedCase,
  type SharedCaseVerifyResult,
} from "@/lib/product/case-sharing-provenance";

type Response =
  | { ok: true; verification: SharedCaseVerifyResult }
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
  if (result.share.role !== "AUDITOR" || !result.view.canVerify) {
    return res.status(403).json({ ok: false, error: "Verification unavailable for this shared view" });
  }

  const verification = await verifySharedGovernedCase(result.view.caseId);
  return res.status(200).json({ ok: true, verification });
}
