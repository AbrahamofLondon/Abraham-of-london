/**
 * pages/api/integrations/google/connect.ts
 * Initiates Google OAuth 2.0 flow by redirecting to Google's consent screen.
 *
 * Flow:
 *   1. User clicks "Connect Google Calendar" in UI
 *   2. UI calls initiateOAuth("google") which redirects here
 *   3. This route redirects to Google OAuth consent screen
 *   4. User authorizes and Google redirects to /api/integrations/google/callback
 *   5. Callback exchanges code for tokens and stores them encrypted
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { generateOAuthState } from "@/lib/integrations/encryption";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const REDIRECT_URI = `${SITE_URL}/api/integrations/google/callback`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      error: "Google OAuth not configured",
      details: "GOOGLE_OAUTH_CLIENT_ID environment variable is not set.",
      resolution: "Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env.local",
    });
  }

  // Generate CSRF state parameter and store in session cookie
  const state = generateOAuthState();

  // Set state in a short-lived cookie for CSRF verification on callback
  res.setHeader(
    "Set-Cookie",
    `oauth_state=${state}; HttpOnly; Secure=${process.env.NODE_ENV === "production"}; SameSite=Lax; Path=/api/integrations/google; Max-Age=600`,
  );

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events.readonly",
      "openid",
      "email",
      "profile",
    ].join(" "),
    access_type: "offline",
    prompt: "consent", // Forces refresh_token on every connection
    state,
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
