// lib/db/interactions.ts
import { Pool } from 'pg';

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
  sessionId?: string | null
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
        AND (session_id IS NOT NULL OR user_id IS NOT NULL)
      GROUP BY action
    `;
    
    const totalsResult = await client.query(totalsQuery, [shortSlug]);
    
    // Get user's interactions if sessionId provided
    let userLiked = false;
    let userSaved = false;
    
    if (sessionId) {
      const userInteractionsQuery = `
        SELECT action 
        FROM short_interactions 
        WHERE short_slug = $1 
          AND deleted_at IS NULL
          AND session_id = $2
      `;
      
      const userResult = await client.query(userInteractionsQuery, [shortSlug, sessionId]);
      userLiked = userResult.rows.some(r => r.action === 'like');
      userSaved = userResult.rows.some(r => r.action === 'save');
    }
    
    // Transform results
    const likesRow = totalsResult.rows.find(r => r.action === 'like');
    const savesRow = totalsResult.rows.find(r => r.action === 'save');
    
    const likes = likesRow ? parseInt(likesRow.count) : 0;
    const saves = savesRow ? parseInt(savesRow.count) : 0;
    
    return {
      likes,
      saves,
      userLiked,
      userSaved,
    };
    
  } catch (error) {
    console.error('Error getting interaction stats:', error);
    // Return defaults on error
    return {
      likes: 0,
      saves: 0,
      userLiked: false,
      userSaved: false,
    };
  } finally {
    client.release();
  }
}

export async function toggleInteraction(
  shortSlug: string,
  action: 'like' | 'save',
  sessionId: string
): Promise<InteractionStats> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if active interaction exists for this session
    const checkQuery = `
      SELECT id, deleted_at 
      FROM short_interactions 
      WHERE short_slug = $1 
        AND action = $2 
        AND session_id = $3
    `;
    
    const existing = await client.query(checkQuery, [shortSlug, action, sessionId]);
    
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
      // Create new interaction with session_id
      await client.query(
        `INSERT INTO short_interactions (short_slug, session_id, action) 
         VALUES ($1, $2, $3)`,
        [shortSlug, sessionId, action]
      );
    }
    
    await client.query('COMMIT');
    
    // Return updated stats
    return await getInteractionStats(shortSlug, sessionId);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error toggling interaction:', error);
    
    // If it's a unique constraint violation, the user already interacted
    if (error instanceof Error && 
        (error.message.includes('unique constraint') || 
         error.message.includes('duplicate key'))) {
      // Return current stats
      return await getInteractionStats(shortSlug, sessionId);
    }
    
    throw error;
  } finally {
    client.release();
  }
}