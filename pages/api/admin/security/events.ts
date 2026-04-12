/* pages/api/admin/security/events.ts — Log Query Engine */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  // High Clearance Check
  if (!session || (session as any).aol?.tier !== "admin" && (session as any).aol?.tier !== "root") {
    return res.status(403).json({ error: "Institutional Clearance Required" });
  }

  const { status = "pending", limit = "10" } = req.query;

  try {
    const events = await prisma.systemAuditLog.findMany({
      where: {
        status: String(status),
        category: "SECURITY"
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(String(limit)),
    });

    return res.status(200).json({ events });
  } catch (error) {
    return res.status(500).json({ error: "Query Failed" });
  }
}