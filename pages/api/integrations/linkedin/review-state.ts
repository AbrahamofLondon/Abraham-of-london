import type { NextApiRequest, NextApiResponse } from "next";

import {
  approveDraft,
  confirmReviewPageSelection,
  getReviewState,
  requireLinkedInReviewerApi,
  resetReviewWorkspace,
  saveDraft,
} from "@/lib/integrations/linkedin/review-workflow";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const actor = await requireLinkedInReviewerApi(req, res);
  if (!actor) return;

  if (req.method === "GET") {
    const state = await getReviewState(actor);
    return res.status(200).json({ ok: true, state });
  }

  if (req.method === "PATCH") {
    const action = String(req.body?.action || "");
    try {
      if (action === "saveDraft") {
        await saveDraft(actor, String(req.body?.content || ""));
      } else if (action === "approve") {
        await approveDraft(actor, req.body?.confirmed === true);
      } else if (action === "confirmPage") {
        await confirmReviewPageSelection(actor);
      } else if (action === "resetWorkspace") {
        await resetReviewWorkspace(actor);
      } else {
        return res.status(400).json({ ok: false, error: "Unsupported action" });
      }
      const state = await getReviewState(actor);
      return res.status(200).json({ ok: true, state });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: error instanceof Error ? error.message : "LinkedIn review action failed",
      });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
