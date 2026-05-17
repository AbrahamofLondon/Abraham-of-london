/**
 * pages/api/admin/outbound/linkedin/mark-posted.ts
 *
 * POST /api/admin/outbound/linkedin/mark-posted
 *
 * Marks a LinkedIn post as posted:
 * - Updates frontmatter status to "posted"
 * - Sets postedAt and linkedinPostUrl
 * - Moves file to content/outbound/linkedin/posted/
 *
 * Admin-only. Requires authentication.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { markPostAsPosted } from "@/lib/outbound/linkedin-utils";
import type { MarkPostedRequest } from "@/lib/outbound/linkedin-types";

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
    const { filename, linkedinPostUrl, postedAt } = req.body as MarkPostedRequest;

    if (!filename) {
      return res.status(400).json({ ok: false, error: "Missing required field: filename" });
    }

    if (!linkedinPostUrl) {
      return res.status(400).json({
        ok: false,
        error: "Missing required field: linkedinPostUrl. A LinkedIn post URL is required to mark as posted.",
      });
    }

    // Validate LinkedIn URL format
    if (!linkedinPostUrl.startsWith("https://www.linkedin.com/")) {
      return res.status(400).json({
        ok: false,
        error: "linkedinPostUrl must be a valid LinkedIn URL (https://www.linkedin.com/...)",
      });
    }

    const result = markPostAsPosted(filename, linkedinPostUrl, postedAt);

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error });
    }

    return res.status(200).json({
      ok: true,
      message: `Post "${filename}" marked as posted and moved to posted/.`,
    });
  } catch (error) {
    console.error("[LINKEDIN_API] Error marking post as posted:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to mark post as posted",
    });
  }
}
