import type { NextApiRequest, NextApiResponse } from "next";

import {
  buildReviewAuthorizationUrl,
  recordReviewAudit,
  requireLinkedInReviewerApi,
  reviewStateCookie,
} from "@/lib/integrations/linkedin/review-workflow";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const actor = await requireLinkedInReviewerApi(req, res);
  if (!actor) return;

  try {
    const { url, state } = buildReviewAuthorizationUrl(actor);
    await recordReviewAudit("LinkedIn OAuth started", actor, {
      workspace: "LinkedIn Review Workspace",
    });
    res.setHeader("Set-Cookie", reviewStateCookie(state));
    return res.redirect(302, url);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "LinkedIn OAuth is not configured",
    });
  }
}
