/**
 * lib/outbound/facebook-publishing-client.ts
 *
 * Meta Graph API publishing client for Facebook Page posts.
 * Supports text + link posts and photo posts with captions.
 *
 * Tokens are resolved server-side via resolveFacebookPageToken().
 * This module never receives a token from the caller — it fetches its own.
 */

import {
  FB_GRAPH_BASE,
  resolveFacebookPageToken,
} from "./facebook-oauth";
import type { FacebookPublishClientResult } from "./facebook-types";

// ─── Error normalisation ──────────────────────────────────────────────────────

export function normaliseFacebookPublishError(
  status: number,
  body?: unknown,
): Pick<FacebookPublishClientResult, "errorCode" | "safeMessage"> {
  // Attempt to extract Graph API error code from response body
  let fbErrorCode: number | undefined;
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error?: { code?: number } }).error;
    fbErrorCode = err?.code;
  }

  if (status === 400 || fbErrorCode === 100) {
    return {
      errorCode: "FB_PAYLOAD_INVALID",
      safeMessage: "Facebook rejected the post payload. Check post text and parameters.",
    };
  }
  if (status === 401 || fbErrorCode === 190) {
    return {
      errorCode: "FB_TOKEN_INVALID",
      safeMessage:
        "Facebook token is invalid or expired. Reconnect via OAuth in the admin console.",
    };
  }
  if (status === 403 || fbErrorCode === 10 || fbErrorCode === 200) {
    return {
      errorCode: "FB_PERMISSION_MISSING",
      safeMessage:
        "Facebook app or Page is missing the required permissions. Reconnect with pages_manage_posts scope.",
    };
  }
  if (status === 429 || fbErrorCode === 32 || fbErrorCode === 613) {
    return {
      errorCode: "FB_RATE_LIMITED",
      safeMessage: "Facebook rate limit reached. Wait before trying again.",
    };
  }
  return {
    errorCode: "FB_POST_FAILED",
    safeMessage: `Facebook publishing failed with HTTP ${status}.`,
  };
}

// ─── Link post (text + optional link) ────────────────────────────────────────

export async function publishLinkPostToFacebook(input: {
  message: string;
  link?: string | null;
  dryRun?: boolean;
}): Promise<FacebookPublishClientResult> {
  if (input.dryRun) {
    return {
      ok: true,
      status: "succeeded",
      postId: "dry_run",
      postUrl: undefined,
    };
  }

  const resolved = await resolveFacebookPageToken();
  if (!resolved) {
    return {
      ok: false,
      status: "failed",
      errorCode: "FB_NOT_CONNECTED",
      safeMessage: "Facebook Page connection is not available.",
    };
  }

  const { token, pageId } = resolved;

  try {
    const url = `${FB_GRAPH_BASE}/${pageId}/feed`;
    const body: Record<string, string> = {
      message: input.message,
      access_token: token,
    };
    if (input.link) {
      body.link = input.link;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const json = await res.json().catch(() => ({})) as Record<string, unknown>;

    if (!res.ok) {
      const normalised = normaliseFacebookPublishError(res.status, json);
      return { ok: false, status: "failed", ...normalised };
    }

    const postId = typeof json.id === "string" ? json.id : undefined;
    const postUrl = postId
      ? `https://www.facebook.com/${postId}`
      : undefined;

    return {
      ok: true,
      status: "succeeded",
      postId,
      postUrl,
    };
  } catch {
    return {
      ok: false,
      status: "failed",
      errorCode: "FB_NETWORK_FAILURE",
      safeMessage: "Network failure while publishing to Facebook.",
    };
  }
}

// ─── Photo post (image + caption) ────────────────────────────────────────────

export async function publishPhotoPostToFacebook(input: {
  caption: string;
  imageUrl: string;  // must be an absolute public URL
  dryRun?: boolean;
}): Promise<FacebookPublishClientResult> {
  if (input.dryRun) {
    return {
      ok: true,
      status: "succeeded",
      postId: "dry_run",
      postUrl: undefined,
    };
  }

  const resolved = await resolveFacebookPageToken();
  if (!resolved) {
    return {
      ok: false,
      status: "failed",
      errorCode: "FB_NOT_CONNECTED",
      safeMessage: "Facebook Page connection is not available.",
    };
  }

  const { token, pageId } = resolved;

  try {
    const url = `${FB_GRAPH_BASE}/${pageId}/photos`;
    const body = {
      caption: input.caption,
      url: input.imageUrl,
      access_token: token,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });

    const json = await res.json().catch(() => ({})) as Record<string, unknown>;

    if (!res.ok) {
      const normalised = normaliseFacebookPublishError(res.status, json);
      return { ok: false, status: "failed", ...normalised };
    }

    const postId = typeof json.post_id === "string"
      ? json.post_id
      : typeof json.id === "string"
      ? json.id
      : undefined;

    const postUrl = postId
      ? `https://www.facebook.com/${postId}`
      : undefined;

    return {
      ok: true,
      status: "succeeded",
      postId,
      postUrl,
    };
  } catch {
    return {
      ok: false,
      status: "failed",
      errorCode: "FB_NETWORK_FAILURE",
      safeMessage: "Network failure while publishing photo to Facebook.",
    };
  }
}
