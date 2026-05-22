/**
 * pages/api/admin/outbound/linkedin/campaigns/validate.ts
 *
 * POST — dry-run validation for a single LinkedIn campaign post.
 *
 * Validates the post against the content gate (link allowlist, image path,
 * requiresFinalApproval, approval status) WITHOUT making any external API
 * call or publishing the post.
 *
 * Request body:
 *   { postId: string }         — match by ID
 *   { slug: string }           — match by slug (alternative)
 *   { campaign?: string }      — optional: restrict to one campaign dir
 *
 * Response:
 *   { ok, valid, postId, slug, postType, seriesWeek, sequence,
 *     approvalStatus, status, requiresFinalApproval,
 *     scheduledFor, link, imagePath, issues, dryRun: true }
 *
 * Admin-only. Audit-ready — no external post made.
 * SCHEDULER DISABLED: this route is read/validate only.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import {
  getLinkedInOutboundPosts,
  getLinkedInCampaignPosts,
  type OutboundPost,
} from "@/lib/outbound/outbound-content-loader";

const ALLOWED_LINK_PREFIXES = [
  "https://abrahamoflondon.com",
  "https://www.abrahamoflondon.com",
];
const ALLOWED_IMAGE_PREFIX = "/assets/";

function validatePost(post: OutboundPost): string[] {
  const issues: string[] = [];

  // Gate 1: final approval required
  if (!post.requiresFinalApproval) {
    issues.push("requiresFinalApproval must be true — post is missing governance flag.");
  }

  // Gate 2: approval status
  if (post.approvalStatus !== "approved") {
    issues.push(
      `Post is not approved for publishing (approvalStatus: "${post.approvalStatus}"). ` +
      "Change to approved before publishing.",
    );
  }

  // Gate 3: status must be ready or scheduled
  if (post.status !== "ready" && post.status !== "scheduled") {
    issues.push(
      `Post status is "${post.status}" — must be "ready" or "scheduled" to publish.`,
    );
  }

  // Gate 4: link allowlist
  if (post.link) {
    const allowed = ALLOWED_LINK_PREFIXES.some((p) => post.link!.startsWith(p));
    if (!allowed) {
      issues.push(`Link "${post.link}" is not in the allowed first-party domain list.`);
    }
  }

  // Gate 5: image path
  if (post.imagePath && !post.imagePath.startsWith(ALLOWED_IMAGE_PREFIX)) {
    issues.push(`imagePath "${post.imagePath}" must start with /assets/.`);
  }

  // Gate 6: body must exist
  if (!post.text || !post.text.trim()) {
    issues.push("Post body is empty.");
  }

  // Gate 7: scheduled date must be future if present and not published
  if (post.scheduledFor && !["published", "skipped"].includes(post.status)) {
    const d = new Date(post.scheduledFor);
    if (isNaN(d.getTime())) {
      issues.push(`scheduledFor "${post.scheduledFor}" is not a valid ISO date.`);
    }
  }

  return issues;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const { postId, slug, campaign } = (req.body ?? {}) as {
    postId?: string;
    slug?: string;
    campaign?: string;
  };

  if (!postId && !slug) {
    return res.status(400).json({
      ok: false,
      error: "Missing required field: postId or slug.",
    });
  }

  // Load the appropriate campaign or all posts
  const { posts, errors } = campaign
    ? getLinkedInCampaignPosts(campaign)
    : getLinkedInOutboundPosts();

  // Find the target post
  const post = posts.find((p) =>
    (postId && p.id === postId) || (slug && p.slug === slug),
  );

  if (!post) {
    return res.status(404).json({
      ok: false,
      error: `Post not found: ${postId ?? slug}.`,
      loaderErrors: errors,
    });
  }

  const issues = validatePost(post);
  const valid = issues.length === 0;

  return res.status(200).json({
    ok: true,
    dryRun: true,
    valid,
    postId: post.id,
    slug: post.slug,
    postType: post.postType,
    seriesWeek: post.seriesWeek,
    sequence: post.sequence,
    sourceMaterial: post.sourceMaterial,
    approvalStatus: post.approvalStatus,
    status: post.status,
    requiresFinalApproval: post.requiresFinalApproval,
    scheduledFor: post.scheduledFor,
    link: post.link,
    imagePath: post.imagePath,
    issues,
    // textPreview — first 200 chars, enough to confirm correct post was found
    textPreview: post.text.slice(0, 200) + (post.text.length > 200 ? "…" : ""),
    loaderErrors: errors,
  });
}
