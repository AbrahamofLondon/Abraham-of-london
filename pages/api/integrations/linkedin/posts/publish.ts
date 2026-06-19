import type { NextApiRequest, NextApiResponse } from "next";

import {
  getReviewState,
  publishOrDryRun,
  requireLinkedInReviewerApi,
} from "@/lib/integrations/linkedin/review-workflow";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const actor = await requireLinkedInReviewerApi(req, res);
  if (!actor) return;

  try {
    const result = await publishOrDryRun(actor);
    const state = await getReviewState(actor);
    return res.status(200).json({ ok: true, result, state });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "LinkedIn publish action failed",
    });
  }
}
