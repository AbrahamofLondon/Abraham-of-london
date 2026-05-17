/**
 * pages/api/admin/outbound/linkedin/update-status.ts
 *
 * POST /api/admin/outbound/linkedin/update-status
 *
 * Updates the status of a LinkedIn post (e.g., "draft" → "ready").
 *
 * Admin-only. Requires authentication.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { updatePostStatus } from "@/lib/outbound/linkedin-utils";
import type { UpdateStatusRequest, LinkedInStatus } from "@/lib/outbound/linkedin-types";

const VALID_STATUSES: LinkedInStatus[] = [
  "draft",
  "ready",
  "posted",
  "archived",
  "needs_review",
];

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
    const { filename, status } = req.body as UpdateStatusRequest;

    if (!filename) {
      return res.status(400).json({ ok: false, error: "Missing required field: filename" });
    }

    if (!status) {
      return res.status(400).json({ ok: false, error: "Missing required field: status" });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid status "${status}". Expected one of: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    const result = updatePostStatus(filename, status);

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error });
    }

    return res.status(200).json({
      ok: true,
      message: `Post "${filename}" status updated to "${status}".`,
    });
  } catch (error) {
    console.error("[LINKEDIN_API] Error updating post status:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to update post status",
    });
  }
}
