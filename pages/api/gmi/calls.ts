import type { NextApiRequest, NextApiResponse } from "next";

import { getPersistedPublicGmiCallLedger } from "@/lib/intelligence/gmi-persistent-ledger";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const calls = await getPersistedPublicGmiCallLedger();
  return res.status(200).json({
    methodology: {
      endpoint: "/intelligence/gmi/methodology",
      note: "Public call ledger excludes private notes and unpublished client context.",
    },
    calls,
    total: calls.length,
  });
}
