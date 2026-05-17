/**
 * pages/api/admin/outbound/linkedin/publish.ts
 *
 * POST /api/admin/outbound/linkedin/publish
 *
 * Publishes a LinkedIn post via the official LinkedIn Posts API.
 *
 * Rules:
 * - Admin only
 * - LINKEDIN_PUBLISHING_ENABLED must be "true"
 * - Must have a connected LinkedIn token
 * - Post status must be "ready"
 * - platform must be "linkedin"
 * - channel must be "company"
 * - Body length must be <= 3000 characters
 * - Organisation ID must be set
 * - Refuse if already posted
 *
 * On success:
 * - Records LinkedIn post ID/URN
 * - Updates frontmatter (status: posted, postedAt, linkedinPostUrl)
 * - Moves file to content/outbound/linkedin/posted/
 * - Logs safe audit event
 *
 * On failure:
 * - Does not move file
 * - Does not mark posted
 * - Returns clear error code
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import {
  publishToLinkedIn,
  getConnectionStatus,
} from "@/lib/outbound/linkedin-oauth";
import { getLinkedInPost, markPostAsPosted } from "@/lib/outbound/linkedin-utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  try {
    const { filename } = req.body as { filename?: string };

    if (!filename) {
      return res.status(400).json({ ok: false, error: "Missing required field: filename" });
    }

    // ── Check publishing is enabled ──
    if (process.env.LINKEDIN_PUBLISHING_ENABLED !== "true") {
      return res.status(503).json({
        ok: false,
        error: "LinkedIn publishing is disabled.",
        errorCode: "LINKEDIN_PUBLISHING_DISABLED",
        message:
          "Set LINKEDIN_PUBLISHING_ENABLED=true in your environment to enable publishing.",
      });
    }

    // ── Check connection status ──
    const connectionStatus = await getConnectionStatus();
    if (!connectionStatus.connected) {
      return res.status(400).json({
        ok: false,
        error: connectionStatus.message,
        errorCode: "LINKEDIN_NOT_CONNECTED",
        message: "Connect to LinkedIn first via the Connect button in the dashboard.",
      });
    }

    // ── Check required scopes ──
    if (!connectionStatus.scopes.includes("w_organization_social")) {
      return res.status(400).json({
        ok: false,
        error: "Missing required LinkedIn scope: w_organization_social.",
        errorCode: "LINKEDIN_SCOPE_MISSING",
        message: "Reconnect LinkedIn with the correct permissions.",
      });
    }

    // ── Load and validate the post ──
    const post = getLinkedInPost(filename);
    if (!post) {
      return res.status(404).json({
        ok: false,
        error: `Post not found: ${filename}`,
      });
    }

    // Check already posted
    if (post.isPosted || post.frontmatter.status === "posted") {
      return res.status(400).json({
        ok: false,
        error: `Post "${filename}" is already marked as posted.`,
        errorCode: "LINKEDIN_POST_FAILED",
      });
    }

    // Check status is "ready"
    if (post.frontmatter.status !== "ready") {
      return res.status(400).json({
        ok: false,
        error: `Post status must be "ready" to publish (current: "${post.frontmatter.status}").`,
        errorCode: "LINKEDIN_POST_FAILED",
      });
    }

    // Check platform
    if (post.frontmatter.platform !== "linkedin") {
      return res.status(400).json({
        ok: false,
        error: `Platform must be "linkedin" (current: "${post.frontmatter.platform}").`,
        errorCode: "LINKEDIN_POST_FAILED",
      });
    }

    // Check channel
    if (post.frontmatter.channel !== "company") {
      return res.status(400).json({
        ok: false,
        error: `Channel must be "company" (current: "${post.frontmatter.channel}").`,
        errorCode: "LINKEDIN_POST_FAILED",
      });
    }

    // Check character limit
    if (post.charCount > 3000) {
      return res.status(400).json({
        ok: false,
        error: `Post exceeds LinkedIn's 3,000 character limit (${post.charCount.toLocaleString()}).`,
        errorCode: "LINKEDIN_POST_FAILED",
      });
    }

    // Check organisation ID
    if (!connectionStatus.organisationId) {
      return res.status(400).json({
        ok: false,
        error: "LinkedIn organisation ID is not configured.",
        errorCode: "LINKEDIN_POST_FAILED",
      });
    }

    // ── Publish to LinkedIn ──
    const fm = post.frontmatter;
    const articleUrl = fm.ctaUrl || undefined;
    const articleTitle = fm.ctaLabel || undefined;

    const publishResult = await publishToLinkedIn(
      post.body,
      articleUrl,
      articleTitle,
      fm.title || undefined,
    );

    if (!publishResult.ok) {
      // Log safe audit event (no token values)
      console.log(
        `[LINKEDIN_PUBLISH] Failed to publish "${filename}": ${publishResult.errorCode} — ${publishResult.error}`,
      );

      return res.status(400).json({
        ok: false,
        error: publishResult.error,
        errorCode: publishResult.errorCode,
      });
    }

    // ── On success: update local state ──
    const markResult = markPostAsPosted(
      filename,
      publishResult.linkedinPostUrl || `https://www.linkedin.com/company/${connectionStatus.organisationId}/posts/${publishResult.linkedinPostId}`,
      new Date().toISOString(),
    );

    if (!markResult.ok) {
      // Post was published to LinkedIn but local update failed
      console.error(
        `[LINKEDIN_PUBLISH] Published but local update failed for "${filename}": ${markResult.error}`,
      );
      return res.status(200).json({
        ok: true,
        warning: `Post was published to LinkedIn but local file update failed: ${markResult.error}. LinkedIn post ID: ${publishResult.linkedinPostId}`,
        linkedinPostUrl: publishResult.linkedinPostUrl,
        linkedinPostId: publishResult.linkedinPostId,
      });
    }

    // Log safe audit event
    console.log(
      `[LINKEDIN_PUBLISH] Successfully published "${filename}". LinkedIn ID: ${publishResult.linkedinPostId}`,
    );

    return res.status(200).json({
      ok: true,
      message: `Post "${filename}" published successfully to LinkedIn.`,
      linkedinPostUrl: publishResult.linkedinPostUrl,
      linkedinPostId: publishResult.linkedinPostId,
    });
  } catch (error) {
    console.error("[LINKEDIN_PUBLISH] Unexpected error:", error);
    return res.status(500).json({
      ok: false,
      error: "Unexpected error while publishing to LinkedIn.",
      errorCode: "LINKEDIN_POST_FAILED",
    });
  }
}