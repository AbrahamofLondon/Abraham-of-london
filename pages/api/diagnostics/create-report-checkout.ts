import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  return res.status(410).json({
    ok: false,
    reason: "DIAGNOSTIC_REPORT_PRODUCTS_RETIRED",
    canonicalPath: "/diagnostics/executive-reporting",
  });
}
