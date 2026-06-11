/**
 * pages/api/admin/fulfilment/queue.ts
 *
 * Estate-wide fulfilment queue API. Admin-guarded.
 *
 * GET ?includeArchive=true&sourceTypes=boardroom_brief_order,case_study
 *
 * Returns normalised FulfilmentItem[] for all product sources.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import {
  getEstateFulfilmentItems,
  type FulfilmentItem,
  type FulfilmentSourceType,
} from "@/lib/fulfilment/estate-fulfilment-service";

const VALID_SOURCE_TYPES: FulfilmentSourceType[] = [
  "boardroom_brief_order",
  "product_artifact",
  "executive_report",
  "oversight_review_cycle",
  "retainer_readiness",
  "case_study",
  "oversight_delivery",
];

type ApiResponse = {
  ok: boolean;
  items?: FulfilmentItem[];
  counts?: {
    total: number;
    needsReview: number;
    needsGeneration: number;
    needsDelivery: number;
    overdue: number;
    failed: number;
  };
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-fulfilment-queue" });
  if (!session) return;

  try {
    const includeArchive = req.query.includeArchive === "true";

    let sourceTypes: FulfilmentSourceType[] | undefined;
    if (typeof req.query.sourceTypes === "string" && req.query.sourceTypes) {
      sourceTypes = req.query.sourceTypes
        .split(",")
        .filter((t): t is FulfilmentSourceType => VALID_SOURCE_TYPES.includes(t as FulfilmentSourceType));
      if (sourceTypes.length === 0) sourceTypes = undefined;
    }

    const items = await getEstateFulfilmentItems({ includeArchive, sourceTypes });

    const counts = {
      total: items.length,
      needsReview: items.filter((i) =>
        i.nextAction.toLowerCase().includes("review") ||
        i.nextAction.toLowerCase().includes("start review") ||
        i.nextAction.toLowerCase().includes("review candidate")
      ).length,
      needsGeneration: items.filter((i) => i.generationStatus === "GENERATING" || i.nextAction.toLowerCase().includes("generat")).length,
      needsDelivery: items.filter((i) => i.nextAction.toLowerCase().includes("deliver")).length,
      overdue: items.filter((i) => i.isOverdue).length,
      failed: items.filter((i) => i.deliveryStatus === "FAILED" || i.deliveryStatus === "failed").length,
    };

    return res.status(200).json({ ok: true, items, counts });
  } catch (error) {
    console.error("[admin-fulfilment-queue]", error);
    return res.status(500).json({ ok: false, error: "FETCH_FAILED" });
  }
}
