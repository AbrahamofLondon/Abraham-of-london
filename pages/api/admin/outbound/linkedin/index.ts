/**
 * pages/api/admin/outbound/linkedin/index.ts
 *
 * GET /api/admin/outbound/linkedin
 * Returns all LinkedIn posts (metadata + body, excluding posted/ by default).
 *
 * Admin-only. Requires authentication.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { getAllLinkedInPosts } from "@/lib/outbound/linkedin-utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  try {
    const includePosted = req.query.includePosted === "true";
    const posts = getAllLinkedInPosts(includePosted);

    return res.status(200).json({
      ok: true,
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("[LINKEDIN_API] Error fetching posts:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch LinkedIn posts",
    });
  }
}
