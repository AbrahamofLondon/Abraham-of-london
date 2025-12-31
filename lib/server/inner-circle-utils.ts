/* lib/server/inner-circle-utils.ts */
// Shared utilities to avoid circular dependencies

import { Pool, type PoolClient } from 'pg';

// Utility functions
export function toIso(v: unknown): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : fallback;
}

export function toFloat(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : fallback;
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>"'`;]/g, "");
}

// Database connection pool
let sharedPool: Pool | null = null;

export function getPool(): Pool | null {
  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) return null;

  if (!sharedPool) {
    sharedPool = new Pool({
      connectionString: conn,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl:
        conn.includes("localhost") ||
        conn.includes("127.0.0.1") ||
        conn.includes("192.168.")
          ? undefined
          : { rejectUnauthorized: false },
    });

    sharedPool.on("error", (err) => {
      console.error("[InnerCircle] pool error:", err);
      sharedPool = null;
    });
  }

  return sharedPool;
}

// Database client
type QueryParams = readonly unknown[];
type TxFn<T> = (client: PoolClient) => Promise<T>;

export class DatabaseClient {
  private static async withClient<T>(
    operation: string,
    fn: TxFn<T>,
    fallback: T,
    transactional: boolean
  ): Promise<T> {
    const pool = getPool();
    if (!pool) return fallback;

    const client = await pool.connect();
    try {
      if (transactional) await client.query("BEGIN");
      const out = await fn(client);
      if (transactional) await client.query("COMMIT");
      return out;
    } catch (err) {
      if (transactional) {
        try {
          await client.query("ROLLBACK");
        } catch (rb) {
          console.error("[InnerCircle] rollback failed:", rb);
        }
      }
      console.error(`[InnerCircle] ${operation} failed:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  static query<T>(
    operation: string, 
    text: string, 
    params: QueryParams, 
    fallback: T
  ): Promise<T> {
    return this.withClient(
      operation,
      async (client) => {
        const r = await client.query(text, params as any[]);
        return r.rows as unknown as T;
      },
      fallback,
      false
    );
  }

  static transactional<T>(
    operation: string, 
    fn: TxFn<T>, 
    fallback: T
  ): Promise<T> {
    return this.withClient(operation, fn, fallback, true);
  }
}