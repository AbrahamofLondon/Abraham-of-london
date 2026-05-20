import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import {
  exchangeCodeForToken,
  LINKEDIN_OAUTH_STATE_COOKIE,
  validateLinkedInOAuthState,
} from "@/lib/outbound/linkedin-oauth";

const ADMIN_LINKEDIN_CONSOLE = "/admin/outbound/linkedin";

function clearStateCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${LINKEDIN_OAUTH_STATE_COOKIE}=; HttpOnly;${secure} SameSite=Lax; Path=/api/admin/outbound/linkedin/oauth/callback; Max-Age=0`;
}

function redirectWithStatus(
  res: NextApiResponse,
  status: "success" | "denied" | "error",
  code?: string,
) {
  const params = new URLSearchParams({ connection: status });
  if (code) params.set("code", code);
  return res.redirect(302, `${ADMIN_LINKEDIN_CONSOLE}?${params.toString()}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const { code, state, error } = req.query;
  if (error) return redirectWithStatus(res, "denied", "authorization_denied");
  if (typeof code !== "string") return redirectWithStatus(res, "error", "missing_code");
  if (typeof state !== "string") return redirectWithStatus(res, "error", "missing_state");

  const expectedState = req.cookies?.[LINKEDIN_OAUTH_STATE_COOKIE];
  if (!expectedState || !validateLinkedInOAuthState(state, expectedState)) {
    return redirectWithStatus(res, "error", "state_mismatch");
  }

  res.setHeader("Set-Cookie", clearStateCookie());

  const result = await exchangeCodeForToken(code, guard.session?.user?.id ?? null);
  if (!result.ok) return redirectWithStatus(res, "error", "token_exchange_failed");

  return redirectWithStatus(res, "success");
}
