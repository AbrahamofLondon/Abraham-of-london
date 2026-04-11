import type { NextApiRequest, NextApiResponse } from "next";

import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import type { InnerCircleAccess } from "@/lib/inner-circle/access.server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InnerCircleAccess>,
) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  if (req.method === "HEAD") {
    const access = await getInnerCircleAccess(req);
    return res.status(access.hasAccess ? 200 : 401).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res.status(405).json({
      hasAccess: false,
      reason: "no_request",
      tier: "public",
    });
  }

  try {
    const access = await getInnerCircleAccess(req);
    return res.status(200).json(access);
  } catch (error) {
    console.error("[INNER_CIRCLE_ACCESS_ERROR]", error);
    return res.status(500).json({
      hasAccess: false,
      reason: "internal_error",
      tier: "public",
    });
  }
}
