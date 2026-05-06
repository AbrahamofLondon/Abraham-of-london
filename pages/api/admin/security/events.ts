/* pages/api/admin/security/events.ts — Log Query Engine */
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "@/lib/prisma.server";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

const querySchema = z.object({
  status: z.string().trim().max(40).optional().default("pending"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
}).strict();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-security-events" });
  if (!session) return;

  const parsedQuery = querySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({ error: "INVALID_REQUEST" });
  }

  const { status, limit } = parsedQuery.data;

  try {
    const events = await prisma.systemAuditLog.findMany({
      where: {
        status: String(status),
        category: "SECURITY"
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.status(200).json({ events });
  } catch (error) {
    return res.status(500).json({ error: "Query Failed" });
  }
}
