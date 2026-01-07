import type { NextApiRequest, NextApiResponse } from "next";

function safeReturnTo(v: unknown): string {
  if (typeof v !== "string") return "/canon";
  const s = v.trim();

  // must be an internal path
  if (!s.startsWith("/")) return "/canon";
  if (s.startsWith("//")) return "/canon";
  if (s.includes("http://") || s.includes("https://")) return "/canon";

  // keep it simple; allow only internal routes
  if (s.includes("\n") || s.includes("\r")) return "/canon";

  return s;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // allow GET so it can be a simple link
  res.clearPreviewData();

  const returnTo = safeReturnTo(req.query?.returnTo);
  return res.redirect(302, returnTo);
}

