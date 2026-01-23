// pages/api/access/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { clearCookieHeader, getCookieName } from "@/lib/server/access";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Set-Cookie", clearCookieHeader(getCookieName()));
  return res.status(200).json({ ok: true });
}