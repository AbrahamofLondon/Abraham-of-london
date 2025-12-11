// lib/db/interactions.ts
import { Pool } from 'pg';
import { anonymizeIp } from '@/lib/rate-limit';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.INNER_CIRCLE_DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export interface InteractionStats {
  likes: number;
  saves: number;
  userLiked: boolean;
  userSaved: boolean;
}

export async function getInteractionStats(
  shortSlug: string,
  userId?: string | null
): Promise<InteractionStats> {
  const client = await pool.connect();
  
  try {
    // Get total likes and saves (excluding deleted)
    const totalsQuery = `
      SELECT 
        action,
        COUNT(*) as count
      FROM short_interactions 
      WHERE short_slug = $1 
        AND deleted_at IS NULL
      GROUP BY action
    `;
    
    const totalsResult = await client.query(totalsQuery, [shortSlug]);
    
    // Get user's interactions
    let userInteractionsQuery = `
      SELECT action 
      FROM short_interactions 
      WHERE short_slug = $1 
        AND deleted_at IS NULL
    `;
    
    const queryParams: any[] = [shortSlug];
    
    if (userId) {
      userInteractionsQuery += ` AND user_id = $2`;
      queryParams.push(userId);
    } else {
      userInteractionsQuery += ` AND user_id IS NULL`;
    }
    
    const userResult = await client.query(userInteractionsQuery, queryParams);
    
    // Transform results
    const likesRow = totalsResult.rows.find(r => r.action === 'like');
    const savesRow = totalsResult.rows.find(r => r.action === 'save');
    
    const likes = likesRow ? parseInt(likesRow.count) : 0;
    const saves = savesRow ? parseInt(savesRow.count) : 0;
    const userLiked = userResult.rows.some(r => r.action === 'like');
    const userSaved = userResult.rows.some(r => r.action === 'save');
    
    return {
      likes,
      saves,
      userLiked,
      userSaved,
    };
    
  } catch (error) {
    console.error('Error getting interaction stats:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function toggleInteraction(
  shortSlug: string,
  action: 'like' | 'save',
  userId?: string | null
): Promise<InteractionStats> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if active interaction exists
    const checkQuery = `
      SELECT id, deleted_at 
      FROM short_interactions 
      WHERE short_slug = $1 
        AND action = $2 
        AND user_id ${userId ? '= $3' : 'IS NULL'}
    `;
    
    const checkParams: any[] = [shortSlug, action];
    if (userId) checkParams.push(userId);
    
    const existing = await client.query(checkQuery, checkParams);
    
    if (existing.rows.length > 0) {
      const interaction = existing.rows[0];
      
      if (interaction.deleted_at) {
        // Restore deleted interaction
        await client.query(
          `UPDATE short_interactions 
           SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [interaction.id]
        );
      } else {
        // Soft delete existing interaction
        await client.query(
          `UPDATE short_interactions 
           SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [interaction.id]
        );
      }
    } else {
      // Create new interaction
      await client.query(
        `INSERT INTO short_interactions (short_slug, user_id, action) 
         VALUES ($1, $2, $3)`,
        [shortSlug, userId || null, action]
      );
    }
    
    await client.query('COMMIT');
    
    // Return updated stats
    return await getInteractionStats(shortSlug, userId);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error toggling interaction:', error);
    throw error;
  } finally {
    client.release();
  }
}