// Retired: explicit no-op. Historical tier drift reconciliation is obsolete.
import type { NextApiRequest, NextApiResponse } from "next";
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ ok: false, error: "Endpoint retired" });
}
