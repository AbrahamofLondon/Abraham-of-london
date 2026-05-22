/**
 * pages/api/admin/outbound/facebook/queue.ts
 *
 * GET  — returns all Facebook outbound post drafts from content/outbound/facebook/
 *
 * Admin-only. Returns posts in scheduled order.
 * No post is published here — this is a read-only queue view.
 *
 * SCHEDULER DISABLED: OUTBOUND_SCHEDULER_ENABLED must be true before
 * any auto-publish logic is wired. Until then, this route is read-only.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import {
  getFacebookOutboundPosts,
} from "@/lib/outbound/outbound-content-loader";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const { posts, errors } = getFacebookOutboundPosts();

  return res.status(200).json({
    ok: true,
    provider: "facebook",
    count: posts.length,
    posts: posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      postType: p.postType,
      status: p.status,
      approvalStatus: p.approvalStatus,
      scheduledFor: p.scheduledFor,
      requiresFinalApproval: p.requiresFinalApproval,
      link: p.link,
      imagePath: p.imagePath,
      tone: p.tone,
      theme: p.theme,
      campaign: p.campaign,
      series: p.series,
      sourceSlug: p.sourceSlug,
      idempotencyKey: p.idempotencyKey,
      // Truncate preview text for the queue list
      textPreview: p.text.slice(0, 200) + (p.text.length > 200 ? "…" : ""),
    })),
    errors,
    schedulerEnabled: process.env.OUTBOUND_SCHEDULER_ENABLED === "true",
  });
}
