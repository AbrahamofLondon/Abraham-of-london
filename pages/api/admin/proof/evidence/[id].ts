import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
import { updateProofEvidence } from "@/lib/proof/evidence";

type ResponseBody =
  | { ok: true; item: NonNullable<Awaited<ReturnType<typeof updateProofEvidence>>> }
  | { ok: false; error: string };

function s(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const id = s(req.query.id);
  if (!id) return res.status(400).json({ ok: false, error: "ID_REQUIRED" });

  let item;
  try {
    item = await updateProofEvidence(id, {
      proofType: s(req.body?.proofType) as any,
      outcomeCategory: s(req.body?.outcomeCategory),
      anonymisedSummary: s(req.body?.anonymisedSummary),
      displayLabel: s(req.body?.displayLabel),
      userType: s(req.body?.userType),
      organisationType: s(req.body?.organisationType),
      approvalStatus: s(req.body?.approvalStatus) as any,
      displayStatus: s(req.body?.displayStatus) as any,
      sourceKind: s(req.body?.sourceKind) as any,
      adminNotes: s(req.body?.adminNotes),
      metadata: { adminUserId: admin.userId, adminEmail: admin.email },
    });
  } catch (error) {
    console.error("[ADMIN_PROOF_UPDATE_ERROR]", error);
    return res.status(500).json({ ok: false, error: "PROOF_EVIDENCE_UPDATE_FAILED" });
  }

  if (!item) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  return res.status(200).json({ ok: true, item });
}
