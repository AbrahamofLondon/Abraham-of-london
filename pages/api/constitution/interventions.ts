// pages/api/constitution/interventions.ts
// Corrected: queries StrategicIntervention (not ContentMetadata)
// GET  — returns interventions with their correctionNodes
// PATCH — updates intervention status or correctionNode status

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

function safeStr(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // ── GET ─────────────────────────────────────────────────────────────────────

  if (req.method === "GET") {
    try {
      const { organisationId, status, domain } = req.query;

      const where: Record<string, unknown> = {};
      if (typeof organisationId === "string" && organisationId.trim()) {
        where.organisationId = organisationId.trim();
      }
      if (typeof status === "string" && status.trim()) {
        where.status = status.trim();
      }
      if (typeof domain === "string" && domain.trim()) {
        where.domain = domain.trim();
      }

      const interventions = await prisma.strategicIntervention.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        select: {
          id:             true,
          organisationId: true,
          campaignId:     true,
          domain:         true,
          baselineScore:  true,
          status:         true,
          deployedAt:     true,
          createdAt:      true,
          correctionNodes: {
            select: {
              id:          true,
              title:       true,
              description: true,
              priority:    true,
              status:      true,
              createdAt:   true,
            },
            orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
          },
        },
      });

      return res.status(200).json({ success: true, data: interventions });
    } catch (error) {
      console.error("[INTERVENTIONS_GET_ERROR]", error);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve interventions.",
      });
    }
  }

  // ── PATCH ────────────────────────────────────────────────────────────────────
  // Accepts: { id, status, type? } where type = "intervention" | "node"
  // Defaults to updating an Intervention. Pass type:"node" to update a CorrectionNode.

  if (req.method === "PATCH") {
    try {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const id     = safeStr(body?.id);
      const status = safeStr(body?.status);
      const type   = safeStr(body?.type, "intervention");

      if (!id)     return res.status(400).json({ success: false, error: "id is required." });
      if (!status) return res.status(400).json({ success: false, error: "status is required." });

      const VALID_INTERVENTION_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
      const VALID_NODE_STATUSES         = ["OPEN",    "IN_PROGRESS", "RESOLVED",  "DISMISSED"];

      if (type === "node") {
        if (!VALID_NODE_STATUSES.includes(status)) {
          return res.status(400).json({
            success: false,
            error: `Invalid node status. Valid values: ${VALID_NODE_STATUSES.join(", ")}`,
          });
        }

        const updated = await prisma.correctionNode.update({
          where: { id },
          data:  { status },
        });

        return res.status(200).json({ success: true, data: updated });
      }

      // Default: update intervention
      if (!VALID_INTERVENTION_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid intervention status. Valid values: ${VALID_INTERVENTION_STATUSES.join(", ")}`,
        });
      }

      const updateData: Record<string, unknown> = { status };

      // Set deployedAt when transitioning to IN_PROGRESS for the first time
      if (status === "IN_PROGRESS") {
        updateData.deployedAt = new Date();
      }

      const updated = await prisma.strategicIntervention.update({
        where: { id },
        data:  updateData,
        select: {
          id:            true,
          status:        true,
          domain:        true,
          deployedAt:    true,
          correctionNodes: {
            select: { id: true, title: true, priority: true, status: true },
          },
        },
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error("[INTERVENTIONS_PATCH_ERROR]", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update intervention.",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}