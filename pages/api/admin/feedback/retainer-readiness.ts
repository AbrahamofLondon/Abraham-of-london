import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { createRetainerReadinessEvaluationFromFeedbackCluster } from "@/lib/feedback/retainer-trigger-score";

type ResponseBody =
  | { ok: true; evaluationId: string; readinessClass: string; score: unknown }
  | { ok: false; error: string };

function parseFeedbackIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const feedbackIds = parseFeedbackIds(req.body?.feedbackIds);
  if (feedbackIds.length === 0) {
    return res.status(400).json({ ok: false, error: "FEEDBACK_CLUSTER_REQUIRED" });
  }

  try {
    const result = await createRetainerReadinessEvaluationFromFeedbackCluster({
      feedbackIds,
      patternObservationId: typeof req.body?.patternObservationId === "string" ? req.body.patternObservationId : null,
      adminEmail: guard.session?.user?.email ?? "admin",
    });
    return res.status(201).json({
      ok: true,
      evaluationId: result.id,
      readinessClass: result.readinessClass,
      score: result.score,
    });
  } catch (error) {
    console.error("[admin.feedback.retainer-readiness]", error);
    return res.status(500).json({ ok: false, error: "RETAINER_READINESS_CREATION_FAILED" });
  }
}
