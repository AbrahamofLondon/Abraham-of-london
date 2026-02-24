// lib/db/neon.ts — FIXED + SAFEGUARDED (EDGE/HTTP + OPTIONAL WS POOL)
import "server-only";

import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import WebSocket from "ws";
import { secrets } from "@/lib/server/secrets";

/**
 * Institutional Database Client
 * - `sql` uses HTTP (best default for serverless + low cold start)
 * - `getPool()` provides WS pooling when you truly need it
 */

// Neon tuning (safe)
neonConfig.fetchConnectionCache = true;
neonConfig.webSocketConstructor = WebSocket as any;

if (!secrets.DATABASE_URL) {
  throw new Error("[DATABASE] DATABASE_URL is required but missing from secrets");
}

/**
 * 1) Standard SQL Client (HTTP)
 */
export const sql = neon(secrets.DATABASE_URL);

/**
 * 2) Connection Pool (WebSockets)
 * Use sparingly; pooling is only worth it for heavier transactional workloads.
 */
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: secrets.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on("error", (err: Error) => {
      console.error("[DATABASE] Unexpected pool error:", err);
    });
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
  try {
    const start = Date.now();
    const rows = (await sql`SELECT 1 as healthy`) as any[];
    const duration = Date.now() - start;

    if (duration > 1000) console.warn(`[DATABASE] Slow health check: ${duration}ms`);

    return rows?.[0]?.healthy === 1;
  } catch (error) {
    console.error("[DATABASE_HEALTH] Health check failed:", error);
    return false;
  }
}

export async function query<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  const rows = (await sql(strings, ...values)) as any[];
  return rows as T[];
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