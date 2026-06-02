import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import {
  isLinkedInAppProfileKey,
  LinkedInAppProfileError,
} from "@/lib/integrations/linkedin/linkedin-app-profile";
import {
  buildAuthorizationUrl,
  getLinkedInOAuthSmokeDiagnostics,
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

  const requestedProfile =
    typeof req.query.profile === "string" &&
    isLinkedInAppProfileKey(req.query.profile)
      ? req.query.profile
      : undefined;

  try {
    const { url, state } = buildAuthorizationUrl(requestedProfile);
    res.setHeader("Set-Cookie", stateCookie(state));
    return res.redirect(302, url);
  } catch (error) {
    const diagnostics = await getLinkedInOAuthSmokeDiagnostics().catch(() => null);
    const message =
      error instanceof LinkedInAppProfileError
        ? error.message
        : "LinkedIn OAuth start could not build an authorization URL.";
    return res.status(400).json({
      ok: false,
      error: message,
      readiness: diagnostics?.readiness ?? "OAUTH_ERROR",
      missingEnv: diagnostics?.missingEnv ?? [],
      redirectUri: diagnostics?.redirectUri ?? "",
      requestedScopes: diagnostics?.requestedScopes ?? [],
    });
  }
}
