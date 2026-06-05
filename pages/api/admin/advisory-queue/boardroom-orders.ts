/* pages/api/admin/advisory-queue/boardroom-orders.ts — List Boardroom Brief orders */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

type Response = {
  ok: boolean;
  orders?: Array<{
    id: string;
    email: string;
    paymentStatus: string;
    deliveryStatus: string;
    riskLevel: string | null;
    score: number | null;
    createdAt: string;
    stripeSessionId: string;
  }>;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-advisory-boardroom-orders" });
  if (!session) return;

  try {
    const orders = await prisma.boardroomBriefOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        paymentStatus: true,
        deliveryStatus: true,
        riskLevel: true,
        score: true,
        createdAt: true,
        stripeSessionId: true,
      },
    });

    return res.status(200).json({
      ok: true,
      orders: orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[boardroom-orders]", error);
    return res.status(500).json({ ok: false, error: "FETCH_FAILED" });
  }
}
