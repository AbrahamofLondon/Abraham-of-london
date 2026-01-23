// pages/api/access/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessFromRequest } from "@/lib/server/access";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const access = await getAccessFromRequest(req);
  return res.status(200).json({ ok: access.ok, tier: access.tier });
}