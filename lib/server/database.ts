export async function getDatabaseMetrics(): Promise<Record<string, any>> {
  try {
    const [connections, locks, activity] = await Promise.all([
      prisma.$queryRaw`SELECT count(*) FROM pg_stat_activity WHERE state = 'active'`,
      prisma.$queryRaw`SELECT mode, granted, count(*) FROM pg_locks GROUP BY mode, granted`,
      prisma.$queryRaw`SELECT datname, usename, state, count(*) FROM pg_stat_activity GROUP BY datname, usename, state`,
    ]);

    return {
      activeConnections: connections[0]?.count || 0,
      locks: locks.reduce((acc, lock) => ({
        ...acc,
        [lock.mode]: lock.count
      }), {}),
      activity: activity.map(a => ({
        database: a.datname,
        user: a.usename,
        state: a.state,
        count: a.count,
      })),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Database metrics unavailable' };
  }
}