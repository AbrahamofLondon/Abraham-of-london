/**
 * pages/api/integrations/slack/callback.ts
 * Handles the Slack OAuth 2.0 callback after user authorization.
 *
 * Flow:
 *   1. User authorizes on Slack consent screen
 *   2. Slack redirects here with ?code=...&state=...
 *   3. We verify CSRF state, exchange code for tokens
 *   4. Tokens are encrypted and stored via token-store.ts
 *   5. User is redirected back to Settings > Integrations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { handleOAuthCallback } from "@/lib/integrations";
import { getAuthSession } from "@/lib/auth/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const REDIRECT_URI = `${SITE_URL}/api/integrations/slack/callback`;
const SUCCESS_REDIRECT = `${SITE_URL}/settings/integrations?success=slack`;
const ERROR_REDIRECT = `${SITE_URL}/settings/integrations?error=`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, state, error: oauthError } = req.query;

  // Handle user-denied authorization
  if (oauthError) {
    return res.redirect(`${ERROR_REDIRECT}${oauthError}`);
  }

  // Verify required params
  if (!code || typeof code !== "string") {
    return res.redirect(`${ERROR_REDIRECT}missing_authorization_code`);
  }

  // CSRF: Verify state parameter matches the cookie we set in connect.ts
  const cookieState = req.cookies?.oauth_state;
  if (state && cookieState && state !== cookieState) {
    return res.redirect(`${ERROR_REDIRECT}csrf_mismatch`);
  }

  // Get the authenticated user session
  const session = await getAuthSession();
  if (!session?.user?.id && !session?.user?.email) {
    return res.redirect(`${ERROR_REDIRECT}not_authenticated`);
  }

  // Use email as userId if no id (common with NextAuth)
  const userId = session.user.id || session.user.email;
  if (!userId) {
    return res.redirect(`${ERROR_REDIRECT}no_user_identifier`);
  }

  // Exchange the code for tokens and store them
  const result = await handleOAuthCallback({
    userId: userId as string,
    provider: "slack",
    code,
    redirectUri: REDIRECT_URI,
  });

  if (!result.success) {
    return res.redirect(`${ERROR_REDIRECT}token_exchange_failed&details=${encodeURIComponent(result.error || "Unknown error")}`);
  }

  // Clear the CSRF cookie
  res.setHeader(
    "Set-Cookie",
    `oauth_state=; HttpOnly; Secure=${process.env.NODE_ENV === "production"}; SameSite=Lax; Path=/api/integrations/slack; Max-Age=0`,
  );

  // Redirect back to settings with success
  return res.redirect(SUCCESS_REDIRECT);
}
