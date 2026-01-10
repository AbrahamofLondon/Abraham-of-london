/* lib/server/inner-circle-simple.ts */
// Minimal, working version without complex dependencies

import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (pool) return pool;
  
  const conn = process.env.INNER_CIRCLE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) return null;
  
  pool = new Pool({
    connectionString: conn,
    ssl: conn.includes('localhost') ? undefined : { rejectUnauthorized: false }
  });
  
  return pool;
}

export async function getPrivacySafeStats() {
  const pool = getPool();
  if (!pool) {
    return {
      totalMembers: 0,
      totalKeys: 0,
      activeKeys: 0,
      revokedKeys: 0,
      expiredKeys: 0,
      avgUnlocksPerKey: 0,
      lastCleanup: null,
    };
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM inner_circle_members) as "totalMembers",
          (SELECT COUNT(*) FROM inner_circle_keys) as "totalKeys",
          (SELECT COUNT(*) FROM inner_circle_keys WHERE status = 'active') as "activeKeys",
          (SELECT COUNT(*) FROM inner_circle_keys WHERE status = 'revoked') as "revokedKeys",
          (SELECT COUNT(*) FROM inner_circle_keys WHERE status = 'expired') as "expiredKeys",
          COALESCE(AVG(total_unlocks), 0) as "avgUnlocks",
          MAX(last_used_at) as "lastActivity"
        FROM inner_circle_keys
      `);
      
      const row = result.rows[0] || {};
      
      return {
        totalMembers: parseInt(row.totalMembers || '0', 10),
        totalKeys: parseInt(row.totalKeys || '0', 10),
        activeKeys: parseInt(row.activeKeys || '0', 10),
        revokedKeys: parseInt(row.revokedKeys || '0', 10),
        expiredKeys: parseInt(row.expiredKeys || '0', 10),
        avgUnlocksPerKey: parseFloat(row.avgUnlocks || '0'),
        lastCleanup: row.lastActivity ? new Date(row.lastActivity).toISOString() : null,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting privacy safe stats:', error);
    return {
      totalMembers: 0,
      totalKeys: 0,
      activeKeys: 0,
      revokedKeys: 0,
      expiredKeys: 0,
      avgUnlocksPerKey: 0,
      lastCleanup: null,
    };
  }
}

// Export other methods as needed
export default {
  getPrivacySafeStats,
};

