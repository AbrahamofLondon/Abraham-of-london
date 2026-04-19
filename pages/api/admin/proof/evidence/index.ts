import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
import { createProofEvidence, listProofEvidence } from "@/lib/proof/evidence";

type ResponseBody =
  | { ok: true; items: Awaited<ReturnType<typeof listProofEvidence>> }
  | { ok: true; id: string }
  | { ok: false; error: string };

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    const items = await listProofEvidence({
      approvalStatus: s(req.query.approvalStatus) || undefined,
      displayStatus: s(req.query.displayStatus) || undefined,
      limit: Number(req.query.limit || 100),
    });
    return res.status(200).json({ ok: true, items });
  }

  if (req.method === "POST") {
    const record = await createProofEvidence({
      sourceStage: s(req.body?.sourceStage, "admin_observed"),
      proofType: s(req.body?.proofType, "observed_outcome"),
      outcomeCategory: s(req.body?.outcomeCategory) || null,
      freeTextRaw: s(req.body?.freeTextRaw) || null,
      anonymisedSummary: s(req.body?.anonymisedSummary) || null,
      displayLabel: s(req.body?.displayLabel) || null,
      userType: s(req.body?.userType) || null,
      organisationType: s(req.body?.organisationType) || null,
      sourceKind: "ADMIN_OBSERVED",
      adminNotes: s(req.body?.adminNotes) || null,
      approvalStatus: "PENDING",
      displayStatus: "HIDDEN",
      metadata: { adminUserId: admin.userId, adminEmail: admin.email },
    });
    return res.status(200).json({ ok: true, id: record.id });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
}
