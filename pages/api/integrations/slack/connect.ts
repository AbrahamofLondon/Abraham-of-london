/**
 * pages/api/integrations/slack/connect.ts
 * Initiates Slack OAuth 2.0 flow by redirecting to Slack's consent screen.
 *
 * Flow:
 *   1. User clicks "Connect Slack" in UI
 *   2. UI calls initiateOAuth("slack") which redirects here
 *   3. This route redirects to Slack OAuth consent screen
 *   4. User authorizes and Slack redirects to /api/integrations/slack/callback
 *   5. Callback exchanges code for tokens and stores them encrypted
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { generateOAuthState } from "@/lib/integrations/encryption";

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const REDIRECT_URI = `${SITE_URL}/api/integrations/slack/callback`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SLACK_CLIENT_ID) {
    return res.status(500).json({
      error: "Slack OAuth not configured",
      details: "SLACK_CLIENT_ID environment variable is not set.",
      resolution: "Set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET in .env.local",
    });
  }

  // Generate CSRF state parameter
  const state = generateOAuthState();

  // Set state in a short-lived cookie for CSRF verification on callback
  res.setHeader(
    "Set-Cookie",
    `oauth_state=${state}; HttpOnly; Secure=${process.env.NODE_ENV === "production"}; SameSite=Lax; Path=/api/integrations/slack; Max-Age=600`,
  );

  const params = new URLSearchParams({
    client_id: SLACK_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: [
      "channels:history",
      "channels:read",
      "users:read",
      "users:read.email",
    ].join(" "),
    state,
  });

  res.redirect(`https://slack.com/oauth/v2/authorize?${params.toString()}`);
}
