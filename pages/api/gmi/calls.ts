import type { NextApiRequest, NextApiResponse } from "next";

import { getGmiCallLedger, toPublicCallLedgerEntry } from "@/lib/intelligence/gmi-data-service.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const editionId = typeof req.query.edition === "string" ? req.query.edition : "GMI-Q2-2026";
  const result = await getGmiCallLedger(editionId);
  const calls = result.data.map(toPublicCallLedgerEntry);
  if (!result.provenance.isProductionSafe) {
    return res.status(503).json({
      error: "GMI_DATA_NOT_DERIVED",
      provenance: result.provenance,
      calls: [],
      total: 0,
    });
  }
  return res.status(200).json({
    methodology: {
      endpoint: "/intelligence/gmi/methodology",
      note: "Public call ledger excludes private notes and unpublished client context.",
    },
    provenance: result.provenance,
    calls,
    total: calls.length,
  });
}
