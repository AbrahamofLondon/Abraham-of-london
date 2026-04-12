// pages/api/admin/deal-flow-stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prisma =
    typeof (db as any)?.getPrismaClient === "function"
      ? await (db as any).getPrismaClient()
      : db;

  const submissions = await prisma.dealFlowSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      createdAt: true,
      name: true,
      email: true,
      revenue: true,
      score: true,
      route: true,
      aiScore: true,
      predictedWinProbability: true,
      predictedExpectedRevenue: true,
      predictedPriority: true,
      priority: true,
    },
  });

  const strategy = submissions.filter((s: any) => s.route === "STRATEGY").length;
  const diagnostic = submissions.filter((s: any) => s.route === "DIAGNOSTIC").length;
  const reject = submissions.filter((s: any) => s.route === "REJECT").length;
  const avg = submissions.reduce((a: number, b: any) => a + Number(b.score || 0), 0) / (submissions.length || 1);

  return res.status(200).json({
    strategy,
    diagnostic,
    reject,
    avg,
    submissions,
  });
}