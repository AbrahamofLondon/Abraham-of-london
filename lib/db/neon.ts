// lib/db/neon.ts — FIXED + SAFEGUARDED (EDGE/HTTP + OPTIONAL WS POOL)
import "server-only";

import { neon, neonConfig, Pool, type PoolConfig } from "@neondatabase/serverless";
import WebSocket from "ws";
import { secrets } from "@/lib/server/secrets";
import { shouldUseDatabase } from "@/lib/db/db-gate";

/**
 * Institutional Database Client
 * - `sql` uses HTTP (best default for serverless + low cold start)
 * - `getPool()` provides WS pooling when truly needed
 * - build-safe and skip-safe via db-gate
 */

const canUseDb = shouldUseDatabase();
const databaseUrl = secrets.DATABASE_URL;

// Neon tuning
neonConfig.fetchConnectionCache = true;
neonConfig.webSocketConstructor = WebSocket;

type SqlFn = ReturnType<typeof neon>;

let pool: Pool | null = null;
let cleanupRegistered = false;

function createNoopSql(): SqlFn {
  const noop = (async () => []) as unknown as SqlFn;
  return new Proxy(noop, {
    apply: async () => [],
    get: () => undefined,
  });
}

function assertDatabaseAvailable(context: string): void {
  if (!canUseDb || !databaseUrl) {
    throw new Error(`[DATABASE] Database unavailable for ${context}`);
  }
}

/**
 * 1) Standard SQL Client (HTTP)
 * Build-safe: falls back to a harmless no-op client when DB should not be used.
 */
export const sql: SqlFn =
  canUseDb && databaseUrl ? neon(databaseUrl) : createNoopSql();

/**
 * 2) Connection Pool (WebSockets)
 * Use sparingly; pooling is only worth it for heavier transactional workloads.
 */
function registerCleanupHandlers(): void {
  if (cleanupRegistered) return;
  cleanupRegistered = true;

  const cleanup = async () => {
    try {
      await closePool();
    } finally {
      process.exit(0);
    }
  };

  process.once("SIGTERM", cleanup);
  process.once("SIGINT", cleanup);
}

export function getPool(): Pool {
  assertDatabaseAvailable("pool creation");

  if (!pool) {
    const poolConfig: PoolConfig = {
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    };

    pool = new Pool(poolConfig);

    pool.on("error", (err: Error) => {
      console.error("[DATABASE] Unexpected pool error:", err);
    });

    registerCleanupHandlers();
  }

  return pool;
}

/**
 * 3) Query helpers
 */
export interface BriefResult {
  title: string;
  slug: string;
  category: string | null;
  published_at: Date | null;
}

export async function queryBriefs(limit = 10): Promise<BriefResult[]> {
  if (!canUseDb || !databaseUrl) return [];

  try {
    const safeLimit = Math.min(Math.max(1, limit), 100);

    const rows = (await sql`
      SELECT title, slug, category, published_at
      FROM intelligence_briefs
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT ${safeLimit}
    `) as any[];

    return rows.map((row) => ({
      title: String(row?.title ?? ""),
      slug: String(row?.slug ?? ""),
      category: row?.category ? String(row.category) : null,
      published_at: row?.published_at ? new Date(row.published_at) : null,
    }));
  } catch (error) {
    console.error("[DATABASE_ERROR] Failed to fetch briefs:", error);
    return [];
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  if (!canUseDb || !databaseUrl) return false;

  try {
    const start = Date.now();
    const rows = (await sql`SELECT 1 as healthy`) as any[];
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn(`[DATABASE] Slow health check: ${duration}ms`);
    }

    return rows?.[0]?.healthy === 1;
  } catch (error) {
    console.error("[DATABASE_HEALTH] Health check failed:", error);
    return false;
  }
}

/**
 * 4) Generic query helper with proper typing
 */
export async function query<T = unknown>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  assertDatabaseAvailable("query execution");

  try {
    const rows = (await sql(strings, ...values)) as any[];
    return rows as T[];
  } catch (error) {
    console.error("[DATABASE] Query failed:", error);
    throw error;
  }
}

export async function closePool(): Promise<void> {
  if (!pool) return;

  try {
    await pool.end();
  } catch (error) {
    console.error("[DATABASE] Error closing pool:", error);
  } finally {
    pool = null;
  }
}

export type { Pool };