import type { NextApiRequest, NextApiResponse } from "next";

import {
  getCommercialValidationDashboard,
  recordCommercialValidationEntry,
  type ProductClass,
  type ValidationStatus,
} from "@/lib/admin/commercial-validation";
import { requireAdmin } from "@/lib/access/require-admin";

function isStatus(value: unknown): value is ValidationStatus {
  return value === "PASS" || value === "FAIL" || value === "INCOMPLETE";
}

function isProductClass(value: unknown): value is ProductClass | "global" {
  return (
    value === "global" ||
    value === "executive_reporting" ||
    value === "strategy_room" ||
    value === "decision_instrument" ||
    value === "gmi" ||
    value === "diagnostic_report"
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    try {
      const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : null;
      const data = await getCommercialValidationDashboard(email);
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Validation dashboard load failed",
      });
    }
  }

  if (req.method === "POST") {
    const { productClass, checkKey, status, evidence, note } = req.body || {};
    if (!isProductClass(productClass) || !checkKey || !isStatus(status)) {
      return res.status(400).json({ ok: false, error: "Invalid validation entry" });
    }

    let entry;
    try {
      entry = await recordCommercialValidationEntry({
        productClass,
        checkKey: String(checkKey),
        status,
        evidence: String(evidence || ""),
        note: String(note || ""),
        actorUserId: admin.userId,
        actorEmail: admin.email,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Validation entry save failed",
      });
    }

    return res.status(201).json({ ok: true, id: entry.id });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
