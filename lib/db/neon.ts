// lib/db/neon.ts
import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { secrets } from '@/lib/server/secrets'; // Using your Zod-validated secrets

/**
 * Institutional Database Client
 * Optimized for Next.js Edge/Serverless runtimes.
 */

// Enable connection caching for faster subsequent requests in the same execution context
neonConfig.fetchConnectionCache = true;

// NOTE: neonConfig.logLevel does NOT exist - removed

/**
 * 1. Standard SQL Client (HTTP)
 * Best for: Reading Intelligence Briefs, Essays, and Canons.
 * Benefits: Zero cold-start latency over HTTP.
 */
export const sql = neon(secrets.DATABASE_URL);

/**
 * 2. Connection Pool (WebSockets)
 * Best for: Heavy transactions, Inner Circle Auth, and Administrative CRUD.
 * Benefits: Maintains stateful connections across a single request lifecycle.
 */
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ 
      connectionString: secrets.DATABASE_URL,
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 5000, // Fail if cannot connect within 5s
    });
  }
  return pool;
}

/**
 * 3. Institutional Helper: getIntelligenceBriefs
 * Directly leverages the 163 briefs you've generated in Contentlayer 
 * if you choose to sync them to the DB for global search.
 */
export interface BriefResult {
  title: string;
  slug: string;
  category: string | null;
  published_at: Date | null;
}

export async function queryBriefs(limit = 10): Promise<BriefResult[]> {
  try {
    // Remove generic type argument - let neon infer
    const result = await sql`
      SELECT title, slug, category, published_at 
      FROM intelligence_briefs 
      WHERE status = 'published'
      ORDER BY published_at DESC 
      LIMIT ${limit}
    `;
    
    // Option A: Map/validate the results to ensure shape
    const rows = result as any[];
    return rows.map(row => ({
      title: String(row.title || ''),
      slug: String(row.slug || ''),
      category: row.category ? String(row.category) : null,
      published_at: row.published_at ? new Date(row.published_at) : null,
    })) as BriefResult[];
    
    // Option B (simpler, if you trust the data shape):
    // return result as unknown as BriefResult[];
  } catch (error) {
    console.error('[DATABASE_ERROR] Failed to fetch briefs:', error);
    throw new Error('Intelligence repository unreachable.');
  }
}

/**
 * 4. Health Check
 * Simple query to verify database connectivity
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as healthy`;
    const rows = result as any[];
    return rows && rows.length > 0 && rows[0]?.healthy === 1;
  } catch (error) {
    console.error('[DATABASE_HEALTH] Health check failed:', error);
    return false;
  }
}

/**
 * 5. Cleanup function for graceful shutdown
 * Call this in serverless cleanup handlers if needed
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DATABASE] Connection pool closed');
  }
}

// Type for better DX
export type { Pool };