import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { getFeedbackAdoptionAnalytics, getFeedbackHealthMetrics } from "@/lib/feedback/feedback-service";
import type { FeedbackAdoptionAnalytics, FeedbackHealthMetrics } from "@/lib/feedback/feedback-types";

type ResponseBody =
  | { ok: true; metrics: FeedbackHealthMetrics; analytics: FeedbackAdoptionAnalytics }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  const auth = await requireAdminApi(req, res);
  if (!auth) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const [metrics, analytics] = await Promise.all([
      getFeedbackHealthMetrics(),
      getFeedbackAdoptionAnalytics(),
    ]);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, metrics, analytics });
  } catch (error) {
    console.error("[dashboard.feedback-health]", error);
    return res.status(500).json({ ok: false, error: "FEEDBACK_HEALTH_FAILED" });
  }
}
