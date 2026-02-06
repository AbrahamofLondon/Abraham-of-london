"use server";

import { neon } from '@neondatabase/serverless';
import { headers } from 'next/headers';

/**
 * Logs a brief access event to Neon Postgres.
 * Ensures the 'access_logs' table exists before insertion.
 */
export async function logBriefAccess(briefId: string, briefTitle: string) {
  const sql = neon(process.env.DATABASE_URL!);
  const headerList = await headers();
  const userAgent = headerList.get('user-agent') || 'unknown';

  try {
    // 1. Ensure schema integrity (Vault logic)
    await sql`
      CREATE TABLE IF NOT EXISTS access_logs (
        id SERIAL PRIMARY KEY,
        brief_id TEXT NOT NULL,
        brief_title TEXT NOT NULL,
        accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT
      );
    `;

    // 2. Log the event
    await sql`
      INSERT INTO access_logs (brief_id, brief_title, user_agent)
      VALUES (${briefId}, ${briefTitle}, ${userAgent});
    `;

    return { success: true };
  } catch (error) {
    console.error("Failed to log access to Neon:", error);
    return { success: false };
  }
}