/* pages/api/admin/advisory-queue/boardroom-orders.ts — List Boardroom Brief orders */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

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

  const session = await getServerSession(req, res, authOptions);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  if (!session?.user?.email || session.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(403).json({ ok: false, error: "ADMIN_REQUIRED" });
  }

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
