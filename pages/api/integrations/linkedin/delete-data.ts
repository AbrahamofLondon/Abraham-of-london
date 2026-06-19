import type { NextApiRequest, NextApiResponse } from "next";

import {
  deleteReviewLinkedInData,
  getReviewState,
  requireLinkedInReviewerApi,
} from "@/lib/integrations/linkedin/review-workflow";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const actor = await requireLinkedInReviewerApi(req, res);
  if (!actor) return;

  await deleteReviewLinkedInData(actor);
  const state = await getReviewState(actor);
  return res.status(200).json({ ok: true, state });
}
