import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  return res.status(410).json({
    error: "LEGACY_DOWNLOAD_PATH_DISABLED",
    nextAction: "Use /api/downloads/[slug] through the canonical entitlement flow.",
  });
}

export const config = {
  api: { responseLimit: false, bodyParser: false },
};
