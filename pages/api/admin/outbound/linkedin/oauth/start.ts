import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import {
  buildAuthorizationUrl,
  LINKEDIN_OAUTH_STATE_COOKIE,
} from "@/lib/outbound/linkedin-oauth";

function stateCookie(value: string): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${LINKEDIN_OAUTH_STATE_COOKIE}=${encodeURIComponent(value)}; HttpOnly;${secure} SameSite=Lax; Path=/api/admin/outbound/linkedin/oauth/callback; Max-Age=600`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  try {
    const { url, state } = buildAuthorizationUrl();
    res.setHeader("Set-Cookie", stateCookie(state));
    return res.redirect(302, url);
  } catch {
    return res.status(500).json({
      ok: false,
      error: "LinkedIn OAuth is not configured.",
    });
  }
}
