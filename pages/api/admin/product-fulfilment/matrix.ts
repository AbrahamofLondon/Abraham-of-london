/**
 * pages/api/admin/product-fulfilment/matrix.ts
 *
 * Returns the full product fulfilment readiness matrix for admin use.
 * Admin-only. No external data — computed from static contracts.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { PRODUCT_FULFILMENT_CONTRACTS } from "@/lib/product/product-fulfilment-contract";
import { validateAllContracts } from "@/lib/product/fulfilment-readiness-validator";
import type { EstateReadinessReport } from "@/lib/product/fulfilment-readiness-validator";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EstateReadinessReport | { error: string }>,
) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const report = validateAllContracts(PRODUCT_FULFILMENT_CONTRACTS);
  return res.status(200).json(report);
}
