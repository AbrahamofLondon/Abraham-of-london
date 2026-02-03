// lib/db/neon.ts
import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { secrets } from '@/lib/server/secrets'; // Using your Zod-validated secrets

/**
 * Institutional Database Client
 * Optimized for Next.js Edge/Serverless runtimes.
 */

// Enable connection caching for faster subsequent requests in the same execution context
neonConfig.fetchConnectionCache = true;

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
let pool: Pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: secrets.DATABASE_URL });
  }
  return pool;
}

/**
 * 3. Institutional Helper: getIntelligenceBriefs
 * Directly leverages the 163 briefs you've generated in Contentlayer 
 * if you choose to sync them to the DB for global search.
 */
export async function queryBriefs(limit = 10) {
  try {
    const result = await sql`
      SELECT title, slug, category, published_at 
      FROM intelligence_briefs 
      WHERE status = 'published'
      ORDER BY published_at DESC 
      LIMIT ${limit}
    `;
    return result;
  } catch (error) {
    console.error('[DATABASE_ERROR] Failed to fetch briefs:', error);
    throw new Error('Intelligence repository unreachable.');
  }
}