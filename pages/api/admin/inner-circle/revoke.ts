import type { NextApiRequest, NextApiResponse } from "next";
import { revokeInnerCircleKey } from "@/lib/innerCircleMembership";

type ResponseData = {
  ok: boolean;
  revoked?: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Verify admin key
  const expectedAdminKey = process.env.INNER_CIRCLE_ADMIN_KEY;
  const providedKey = req.headers["x-inner-circle-admin-key"] as string;
  
  if (!expectedAdminKey || providedKey !== expectedAdminKey) {
    return res.status(401).json({ ok: false, error: "Invalid admin key" });
  }

  const { key } = req.body;
  
  if (!key) {
    return res.status(400).json({ ok: false, error: "Key is required" });
  }

  try {
    const revoked = await revokeInnerCircleKey(key);
    return res.status(200).json({
      ok: true,
      revoked,
    });
  } catch (error) {
    console.error("[InnerCircle Admin] Error revoking key:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to revoke key",
    });
  }
}