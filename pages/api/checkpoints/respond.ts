import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";
import { classifyCheckpointOutcome, type RespondToCheckpointInput } from "@/lib/product/checkpoint-scheduler-contract";

function s(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "AUTHENTICATION_REQUIRED" });
  }

  const body = req.body as Partial<RespondToCheckpointInput> | null;
  if (!body?.checkpointId || !body?.responseStatus) {
    return res.status(400).json({ ok: false, error: "CHECKPOINT_ID_AND_STATUS_REQUIRED" });
  }

  try {
    // Try direct ID lookup first, then fall back to sessionId/caseId lookup
    let record = await prisma.diagnosticRecord.findFirst({
      where: {
        id: body.checkpointId,
        diagnosticType: "efficacy_checkpoint",
        userEmail: identity.email.toLowerCase(),
      },
    });

    // Fallback: look up by sessionId or caseId stored in responsesJson
    if (!record) {
      record = await prisma.diagnosticRecord.findFirst({
        where: {
          diagnosticType: "efficacy_checkpoint",
          userEmail: identity.email.toLowerCase(),
          responsesJson: { contains: body.checkpointId },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!record) {
      return res.status(404).json({ ok: false, error: "CHECKPOINT_NOT_FOUND" });
    }

    const existing = JSON.parse(record.responsesJson || "{}");
    const outcome = classifyCheckpointOutcome(body.responseStatus);

    await prisma.diagnosticRecord.update({
      where: { id: record.id },
      data: {
        status: "completed",
        responsesJson: JSON.stringify({
          ...existing,
          response: {
            status: body.responseStatus,
            evidenceNote: s(body.evidenceNote),
            blockerDescription: s(body.blockerDescription),
            whatChanged: s(body.whatChanged),
            whatShouldSystemRemember: s(body.whatShouldSystemRemember),
            respondedAt: new Date().toISOString(),
            classification: outcome,
          },
        }),
      },
    });

    return res.status(200).json({
      ok: true,
      classification: outcome,
      message: "Checkpoint response recorded.",
    });
  } catch (error) {
    console.error("[checkpoint-respond]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
