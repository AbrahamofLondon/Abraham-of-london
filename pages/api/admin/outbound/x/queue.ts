/**
 * pages/api/admin/outbound/x/queue.ts
 *
 * GET  — returns all X outbound post drafts from content/outbound/x/
 *
 * Admin-only. Returns posts in scheduled order.
 * No post is published here — this is a read-only queue view.
 *
 * Thread items are grouped by threadId in the response for UI convenience.
 *
 * SCHEDULER DISABLED: OUTBOUND_SCHEDULER_ENABLED must be true before
 * any auto-publish logic is wired. Until then, this route is read-only.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import {
  getXOutboundPosts,
} from "@/lib/outbound/outbound-content-loader";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const { posts, errors } = getXOutboundPosts();

  // Group threads together for easier UI consumption
  const threadMap = new Map<string, typeof posts>();
  const standalone: typeof posts = [];

  for (const post of posts) {
    if (post.thread && post.threadId) {
      const group = threadMap.get(post.threadId) ?? [];
      group.push(post);
      threadMap.set(post.threadId, group);
    } else {
      standalone.push(post);
    }
  }

  const threads = Array.from(threadMap.entries()).map(([threadId, items]) => ({
    threadId,
    items: items
      .sort((a, b) => (a.threadIndex ?? 0) - (b.threadIndex ?? 0))
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        threadIndex: p.threadIndex,
        status: p.status,
        approvalStatus: p.approvalStatus,
        scheduledFor: p.scheduledFor,
        requiresFinalApproval: p.requiresFinalApproval,
        xCharCount: p.xCharCount,
        link: p.link,
        idempotencyKey: p.idempotencyKey,
        textPreview: p.text.slice(0, 280),
      })),
  }));

  return res.status(200).json({
    ok: true,
    provider: "x",
    count: posts.length,
    standaloneCount: standalone.length,
    threadCount: threadMap.size,
    posts: standalone.map((p) => ({
      id: p.id,
      slug: p.slug,
      postType: p.postType,
      status: p.status,
      approvalStatus: p.approvalStatus,
      scheduledFor: p.scheduledFor,
      requiresFinalApproval: p.requiresFinalApproval,
      xCharCount: p.xCharCount,
      link: p.link,
      tone: p.tone,
      theme: p.theme,
      campaign: p.campaign,
      idempotencyKey: p.idempotencyKey,
      textPreview: p.text.slice(0, 280),
    })),
    threads,
    errors,
    schedulerEnabled: process.env.OUTBOUND_SCHEDULER_ENABLED === "true",
  });
}
