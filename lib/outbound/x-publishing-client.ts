/**
 * lib/outbound/x-publishing-client.ts
 *
 * Twitter API v2 publishing client.
 * POST /2/tweets — text tweets only (v1 media upload not required for link posts).
 *
 * Access token is resolved server-side via resolveXAccessToken().
 * This module never receives a token from the caller.
 */

import { X_API_BASE } from "./x-types";
import { resolveXAccessToken } from "./x-oauth";
import type { XPublishClientResult } from "./x-types";

// ─── Error normalisation ──────────────────────────────────────────────────────

export function normaliseXPublishError(
  status: number,
  body?: unknown,
): Pick<XPublishClientResult, "errorCode" | "safeMessage"> {
  // Extract Twitter API v2 error detail
  let detail = "";
  if (body && typeof body === "object" && "detail" in body) {
    detail = String((body as { detail?: string }).detail ?? "");
  }

  if (status === 400) {
    return {
      errorCode: "X_PAYLOAD_INVALID",
      safeMessage: `X rejected the tweet payload. ${detail}`.trim(),
    };
  }
  if (status === 401) {
    return {
      errorCode: "X_TOKEN_INVALID",
      safeMessage: "X token is invalid or expired. Reconnect via OAuth in the admin console.",
    };
  }
  if (status === 403) {
    return {
      errorCode: "X_PERMISSION_MISSING",
      safeMessage:
        "X app is missing write permission. Ensure tweet.write scope is granted and the app has Elevated access.",
    };
  }
  if (status === 429) {
    return {
      errorCode: "X_RATE_LIMITED",
      safeMessage: "X rate limit reached. Free tier allows 17 posts/24h. Wait before retrying.",
    };
  }
  if (status === 503) {
    return {
      errorCode: "X_SERVICE_UNAVAILABLE",
      safeMessage: "X API is temporarily unavailable. Try again shortly.",
    };
  }
  return {
    errorCode: "X_POST_FAILED",
    safeMessage: `X publishing failed with HTTP ${status}. ${detail}`.trim(),
  };
}

// ─── Publish tweet ────────────────────────────────────────────────────────────

export async function publishTweetToX(input: {
  text: string;
  dryRun?: boolean;
}): Promise<XPublishClientResult> {
  if (input.dryRun) {
    return {
      ok: true,
      status: "succeeded",
      tweetId: "dry_run",
      tweetUrl: undefined,
    };
  }

  const resolved = await resolveXAccessToken();
  if (!resolved) {
    return {
      ok: false,
      status: "failed",
      errorCode: "X_NOT_CONNECTED",
      safeMessage: "X (Twitter) connection is not available. Connect via OAuth.",
    };
  }

  const { accessToken } = resolved;

  try {
    const res = await fetch(`${X_API_BASE}/tweets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: input.text }),
      signal: AbortSignal.timeout(15000),
    });

    const json = await res.json().catch(() => ({})) as Record<string, unknown>;

    if (!res.ok) {
      const normalised = normaliseXPublishError(res.status, json);
      return { ok: false, status: "failed", ...normalised };
    }

    const tweetData = (json.data ?? json) as { id?: string };
    const tweetId = typeof tweetData.id === "string" ? tweetData.id : undefined;
    const tweetUrl = tweetId
      ? `https://x.com/i/web/status/${tweetId}`
      : undefined;

    return {
      ok: true,
      status: "succeeded",
      tweetId,
      tweetUrl,
    };
  } catch {
    return {
      ok: false,
      status: "failed",
      errorCode: "X_NETWORK_FAILURE",
      safeMessage: "Network failure while publishing to X (Twitter).",
    };
  }
}
