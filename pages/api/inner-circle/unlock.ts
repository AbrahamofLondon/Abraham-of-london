// pages/api/inner-circle/unlock.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  // TODO: replace with your real membership validation
  const { key } = req.body;

  if (key !== process.env.INNER_CIRCLE_MASTER_KEY) {
    return res.status(401).json({ success: false, message: "Invalid Key" });
  }

  // Set 7-day signed session
  res.setHeader(
    "Set-Cookie",
    `innerCircleAccess=true; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${
      7 * 24 * 60 * 60
    }`
  );

  return res.status(200).json({ success: true });
}