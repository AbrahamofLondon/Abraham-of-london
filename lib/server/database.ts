/* lib/server/database.ts — DB Metrics (Postgres + Prisma) */
import "server-only";

import { prisma } from "@/lib/prisma.server";

type CountRow = { count: bigint | number | string };
type LockRow = { mode: string; granted: boolean; count: bigint | number | string };
type ActivityRow = {
  datname: string | null;
  usename: string | null;
  state: string | null;
  count: bigint | number | string;
};

function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export async function getDatabaseMetrics(): Promise<Record<string, any>> {
  try {
    const [connectionsRaw, locksRaw, activityRaw] = await Promise.all([
      prisma.$queryRaw`
        SELECT count(*)::bigint AS count
        FROM pg_stat_activity
        WHERE state = 'active'
      `,
      prisma.$queryRaw`
        SELECT mode, granted, count(*)::bigint AS count
        FROM pg_locks
        GROUP BY mode, granted
      `,
      prisma.$queryRaw`
        SELECT datname, usename, state, count(*)::bigint AS count
        FROM pg_stat_activity
        GROUP BY datname, usename, state
      `,
    ]);

    // ✅ Cast AFTER await (works even when $queryRaw is untyped in this project)
    const connections = connectionsRaw as CountRow[];
    const locks = locksRaw as LockRow[];
    const activity = activityRaw as ActivityRow[];

    const activeConnections = toNumber(connections?.[0]?.count);

    // ✅ Avoid generic on reduce when upstream is potentially untyped
    const locksByMode = (locks || []).reduce(
      (acc: Record<string, number>, lock: LockRow) => {
        const key = `${lock.mode}:${lock.granted ? "granted" : "waiting"}`;
        acc[key] = (acc[key] ?? 0) + toNumber(lock.count);
        return acc;
      },
      {} as Record<string, number>
    );

    const activityRows = (activity || []).map((a: ActivityRow) => ({
      database: a.datname ?? "unknown",
      user: a.usename ?? "unknown",
      state: a.state ?? "unknown",
      count: toNumber(a.count),
    }));

    return {
      activeConnections,
      locks: locksByMode,
      activity: activityRows,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Database metrics unavailable",
    };
  }
}