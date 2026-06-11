/**
 * pages/api/admin/boardroom/orders.ts
 *
 * List Boardroom Brief orders with enriched fulfilment data.
 * Admin-guarded. Returns orders with stub presence, proof mode, and delivery deadline.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

export type BoardroomOrderRow = {
  id: string;
  email: string;
  paymentStatus: string;
  deliveryStatus: string;
  riskLevel: string | null;
  score: number | null;
  createdAt: string;
  deliveryDeadline: string;
  deliveredAt: string | null;
  stripeSessionId: string;
  proofMode: boolean;
  source: string;
  artifactStubExists: boolean;
  falsificationStubExists: boolean;
  hypothesisStubExists: boolean;
};

type ApiResponse = {
  ok: boolean;
  orders?: BoardroomOrderRow[];
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-boardroom-orders" });
  if (!session) return;

  try {
    const orders = await prisma.boardroomBriefOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        paymentStatus: true,
        deliveryStatus: true,
        riskLevel: true,
        score: true,
        createdAt: true,
        deliveredAt: true,
        stripeSessionId: true,
        source: true,
        metadata: true,
      },
    });

    if (orders.length === 0) {
      return res.status(200).json({ ok: true, orders: [] });
    }

    const orderIds = orders.map((o) => o.id);

    // Check stub presence in parallel
    const [artifactStubs, falsificationStubs, hypothesisStubs] = await Promise.all([
      prisma.productArtifact.findMany({
        where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: { in: orderIds } },
        select: { sourceEntityId: true },
      }),
      prisma.falsificationEntry.findMany({
        where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: { in: orderIds } },
        select: { sourceEntityId: true },
      }),
      prisma.outcomeHypothesis.findMany({
        where: { sourceRunId: { in: orderIds } },
        select: { sourceRunId: true },
      }),
    ]);

    const artifactSet = new Set(artifactStubs.map((a) => a.sourceEntityId).filter(Boolean) as string[]);
    const falsificationSet = new Set(falsificationStubs.map((f) => f.sourceEntityId).filter(Boolean) as string[]);
    const hypothesisSet = new Set(hypothesisStubs.map((h) => h.sourceRunId).filter(Boolean) as string[]);

    const rows: BoardroomOrderRow[] = orders.map((o) => {
      const meta = (o.metadata as Record<string, unknown> | null) ?? {};
      const proofMode = meta.proofMode === "true" || meta.proofMode === true;
      const deliveryDeadline = new Date(o.createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString();

      return {
        id: o.id,
        email: o.email,
        paymentStatus: o.paymentStatus,
        deliveryStatus: o.deliveryStatus,
        riskLevel: o.riskLevel,
        score: o.score,
        createdAt: o.createdAt.toISOString(),
        deliveryDeadline,
        deliveredAt: o.deliveredAt?.toISOString() ?? null,
        stripeSessionId: o.stripeSessionId,
        proofMode,
        source: o.source,
        artifactStubExists: artifactSet.has(o.id),
        falsificationStubExists: falsificationSet.has(o.id),
        hypothesisStubExists: hypothesisSet.has(o.id),
      };
    });

    return res.status(200).json({ ok: true, orders: rows });
  } catch (error) {
    console.error("[admin-boardroom-orders]", error);
    return res.status(500).json({ ok: false, error: "FETCH_FAILED" });
  }
}
