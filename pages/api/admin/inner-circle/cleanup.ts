// pages/api/admin/inner-circle/cleanup.ts
import type { NextApiRequest, NextApiResponse } from "next";

type CleanupResponse = {
  ok: boolean;
  error?: string;
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<CleanupResponse>
): Promise<void> {
  // Temporary stub: real cleanup logic disabled for this deploy.
  // This avoids build-time module resolution issues on Netlify.
  res.status(501).json({
    ok: false,
    error: "Inner Circle admin cleanup is disabled in this environment.",
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};