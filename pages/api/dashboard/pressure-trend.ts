// pages/api/dashboard/pressure-trend.ts
// Returns daily pressure signal counts for the last N days.
// All data exists in PressureSignalEvent (createdAt).

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

type PressureTrendPoint = {
  date: string; // "2026-06-10"
  count: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PressureTrendPoint[] | { error: string }>,
) {
  try {
    const daysParam = req.query.days;
    const days = typeof daysParam === "string" ? parseInt(daysParam, 10) : 7;
    const clampedDays = Math.max(1, Math.min(90, Number.isFinite(days) ? days : 7));

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - clampedDays);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all signal events from the window
    const signals = await prisma.pressureSignalEvent.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Build a map of date → count
    const countByDate = new Map<string, number>();
    for (const signal of signals) {
      const dateKey = signal.createdAt.toISOString().slice(0, 10); // "2026-06-10"
      countByDate.set(dateKey, (countByDate.get(dateKey) ?? 0) + 1);
    }

    // Fill in all dates in the range, even days with zero signals
    const trend: PressureTrendPoint[] = [];
    const cursor = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (cursor <= today) {
      const dateKey = cursor.toISOString().slice(0, 10);
      trend.push({
        date: dateKey,
        count: countByDate.get(dateKey) ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return res.status(200).json(trend);
  } catch (error) {
    console.error("[DASHBOARD_PRESSURE_TREND_ERROR]", error);
    return res.status(500).json({ error: "Failed to load pressure trend" });
  }
}
