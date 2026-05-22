/**
 * pages/api/admin/outbound/linkedin/queue.ts
 *
 * GET  — returns all LinkedIn outbound campaign post drafts from
 *         content/outbound/linkedin/<campaign>/ subdirectories.
 *
 * Admin-only. Returns posts in scheduled order, grouped by campaign week
 * for UI convenience.
 *
 * An optional ?campaign=<slug> query parameter restricts results to one
 * campaign subdirectory (e.g. ?campaign=the-burden-changes-hands).
 *
 * SCHEDULER DISABLED: OUTBOUND_SCHEDULER_ENABLED must be true before any
 * auto-publish logic is wired. Until then, this route is read-only.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import {
  getLinkedInOutboundPosts,
  getLinkedInCampaignPosts,
} from "@/lib/outbound/outbound-content-loader";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const campaignSlug = typeof req.query.campaign === "string"
    ? req.query.campaign.trim()
    : null;

  const { posts, errors } = campaignSlug
    ? getLinkedInCampaignPosts(campaignSlug)
    : getLinkedInOutboundPosts();

  // Group by seriesWeek for UI convenience
  const weekMap = new Map<number, typeof posts>();
  const unweekly: typeof posts = [];

  for (const post of posts) {
    const week = post.seriesWeek;
    if (week !== null) {
      const group = weekMap.get(week) ?? [];
      group.push(post);
      weekMap.set(week, group);
    } else {
      unweekly.push(post);
    }
  }

  const weeks = Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([seriesWeek, items]) => ({
      seriesWeek,
      items: items
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          postType: p.postType,
          seriesWeek: p.seriesWeek,
          sequence: p.sequence,
          status: p.status,
          approvalStatus: p.approvalStatus,
          scheduledFor: p.scheduledFor,
          requiresFinalApproval: p.requiresFinalApproval,
          sourceSeries: p.sourceSeries,
          sourceMaterial: p.sourceMaterial,
          link: p.link,
          imagePath: p.imagePath,
          tone: p.tone,
          syncTargets: p.syncTargets,
          idempotencyKey: p.idempotencyKey,
          // Truncate preview to ~400 chars — enough to review content type
          textPreview:
            p.text.slice(0, 400) + (p.text.length > 400 ? "…" : ""),
        })),
    }));

  return res.status(200).json({
    ok: true,
    provider: "linkedin",
    campaign: campaignSlug ?? "all",
    count: posts.length,
    weekCount: weekMap.size,
    unweeklyCount: unweekly.length,
    weeks,
    unweekly: unweekly.map((p) => ({
      id: p.id,
      slug: p.slug,
      postType: p.postType,
      status: p.status,
      approvalStatus: p.approvalStatus,
      scheduledFor: p.scheduledFor,
      requiresFinalApproval: p.requiresFinalApproval,
      link: p.link,
      tone: p.tone,
      campaign: p.campaign,
      idempotencyKey: p.idempotencyKey,
      textPreview: p.text.slice(0, 400) + (p.text.length > 400 ? "…" : ""),
    })),
    errors,
    schedulerEnabled: process.env.OUTBOUND_SCHEDULER_ENABLED === "true",
  });
}
