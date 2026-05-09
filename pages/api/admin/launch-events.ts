import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/access/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const guard = await requireAdminApi(req, res);
  if (!guard) return; // already sent 401/403

  const window = (req.query.window as string) ?? "7d";
  const now = new Date();
  let since: Date | undefined;
  if (window === "7d") since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  else if (window === "30d") since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const where: Record<string, unknown> = { diagnosticType: "launch_event" };
    if (since) where.createdAt = { gte: since };

    const records = await prisma.diagnosticRecord.findMany({
      where,
      select: { verdict: true },
    });

    const counts: Record<string, number> = {};
    for (const record of records) {
      const eventName = record.verdict;
      counts[eventName] = (counts[eventName] ?? 0) + 1;
    }

    return res.status(200).json({ ok: true, counts, total: records.length, window });
  } catch (err) {
    console.error("[launch-events] query failed:", err);
    return res.status(500).json({ ok: false, error: "Query failed" });
  }
}
