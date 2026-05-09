import type { NextApiRequest, NextApiResponse } from "next";
import {
  resolveInstitutionalCase,
  resolveByExecutiveRunId,
  resolveByCaseId,
} from "@/lib/product/institutional-case-resolver";
import { buildPublicSummary } from "@/lib/product/institutional-case-contract";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { email, executiveRunId, sessionId, caseId } = req.query;

  try {
    let ic = null;

    if (typeof caseId === "string") {
      ic = await resolveByCaseId(caseId);
    } else if (typeof executiveRunId === "string") {
      ic = await resolveByExecutiveRunId(executiveRunId);
    } else if (typeof email === "string") {
      ic = await resolveInstitutionalCase(email);
    } else if (typeof sessionId === "string") {
      // Strategy Room session — try resolving by caseId first
      ic = await resolveByCaseId(sessionId);
    }

    if (!ic) {
      return res.status(200).json({ case: null });
    }

    return res.status(200).json({ case: buildPublicSummary(ic) });
  } catch {
    return res.status(200).json({ case: null });
  }
}
