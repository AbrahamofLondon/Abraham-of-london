import type { NextApiRequest, NextApiResponse } from "next";

import {
  clearReviewStateCookie,
  completeReviewOAuth,
  LINKEDIN_REVIEW_STATE_COOKIE,
  readReviewOAuthState,
  recordReviewAudit,
  requireLinkedInReviewerApi,
  safeLinkedInReviewOAuthMessage,
} from "@/lib/integrations/linkedin/review-workflow";

const REVIEW_ROUTE = "/integrations/linkedin/review";

function redirect(res: NextApiResponse, status: "success" | "denied" | "error", code?: string, message?: string) {
  const params = new URLSearchParams({ connection: status });
  if (code) params.set("code", code);
  if (message) params.set("message", safeLinkedInReviewOAuthMessage(message));
  return res.redirect(302, `${REVIEW_ROUTE}?${params.toString()}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const actor = await requireLinkedInReviewerApi(req, res);
  if (!actor) return;

  const { code, state, error, error_description } = req.query;
  res.setHeader("Set-Cookie", clearReviewStateCookie());

  if (error) {
    await recordReviewAudit("linkedin_oauth_denied", actor, {
      reasonCode: typeof error === "string" ? error : "authorization_denied",
      redirectOutcome: "denied",
      environmentMode: process.env.NODE_ENV,
    });
    return redirect(
      res,
      "denied",
      typeof error === "string" ? error : "authorization_denied",
      typeof error_description === "string" ? error_description : undefined,
    );
  }
  if (typeof code !== "string") {
    await recordReviewAudit("linkedin_oauth_missing_code", actor, {
      reasonCode: "missing_code",
      redirectOutcome: "error",
      environmentMode: process.env.NODE_ENV,
    });
    return redirect(res, "error", "missing_code");
  }
  if (typeof state !== "string") {
    await recordReviewAudit("linkedin_oauth_failed", actor, {
      reasonCode: "missing_state",
      redirectOutcome: "error",
      environmentMode: process.env.NODE_ENV,
    });
    return redirect(res, "error", "missing_state");
  }

  const expectedState = req.cookies?.[LINKEDIN_REVIEW_STATE_COOKIE];
  if (!readReviewOAuthState(state, expectedState)) {
    await recordReviewAudit("linkedin_oauth_state_mismatch", actor, {
      reasonCode: "state_mismatch",
      redirectOutcome: "error",
      environmentMode: process.env.NODE_ENV,
    });
    return redirect(res, "error", "state_mismatch");
  }

  try {
    await completeReviewOAuth(code, actor);
    return redirect(res, "success");
  } catch (err) {
    await recordReviewAudit("linkedin_oauth_callback_error", actor, {
      reasonCode: "token_exchange_failed",
      redirectOutcome: "error",
      environmentMode: process.env.NODE_ENV,
      safeMessage: err instanceof Error ? safeLinkedInReviewOAuthMessage(err.message) : "LinkedIn OAuth callback failed",
    });
    return redirect(
      res,
      "error",
      "token_exchange_failed",
      err instanceof Error ? err.message : "LinkedIn OAuth callback failed",
    );
  }
}
