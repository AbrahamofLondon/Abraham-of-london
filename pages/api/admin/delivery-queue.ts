import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import {
  listAllDeliveries,
  approveDelivery,
  recordDeliveryOutcome,
} from "@/lib/product/oversight-delivery-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const resolved = await requireAdminApi(req, res);
  if (!resolved) return;

  if (req.method === "GET") {
    try {
      const deliveries = await listAllDeliveries();
      return res.status(200).json({ ok: true, deliveries });
    } catch (error) {
      console.error("[DELIVERY_QUEUE_GET_ERROR]", error);
      return res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load deliveries",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { action, deliveryId } = req.body as {
        action?: string;
        deliveryId?: string;
      };

      if (!deliveryId) {
        return res.status(400).json({ ok: false, error: "deliveryId is required" });
      }

      const operatorId = resolved.session?.user?.id ?? "unknown";

      if (action === "approve") {
        const record = await approveDelivery(deliveryId, operatorId);
        if (!record) {
          return res.status(404).json({ ok: false, error: "Delivery not found" });
        }
        return res.status(200).json({ ok: true, record });
      }

      if (action === "deliver") {
        const record = await recordDeliveryOutcome(deliveryId, {
          status: "DELIVERED",
          deliveredBy: operatorId,
        });
        if (!record) {
          return res.status(404).json({ ok: false, error: "Delivery not found" });
        }
        return res.status(200).json({ ok: true, record });
      }

      if (action === "fail") {
        const record = await recordDeliveryOutcome(deliveryId, {
          status: "FAILED",
          deliveredBy: operatorId,
        });
        if (!record) {
          return res.status(404).json({ ok: false, error: "Delivery not found" });
        }
        return res.status(200).json({ ok: true, record });
      }

      return res.status(400).json({ ok: false, error: "Unknown action" });
    } catch (error) {
      console.error("[DELIVERY_QUEUE_POST_ERROR]", error);
      return res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update delivery",
      });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
