/* lib/server/inner-circle-queries.ts */
// Centralized complex query definitions for the Inner Circle system

import { DatabaseClient } from './inner-circle';
import { toIso, toInt, toFloat } from './inner-circle';

export interface QueryFilters {
  status?: string;
  tier?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  memberId?: string;
  ipAddress?: string;
  minUnlocks?: number;
  maxUnlocks?: number;
}

export interface AnalyticsPeriod {
  startDate: string;
  endDate: string;
  interval: 'hour' | 'day' | 'week' | 'month';
}

export class InnerCircleQueries {
  /**
   * Get comprehensive member statistics
   */
  static async getMemberStatistics(memberId: string) {
    return DatabaseClient.query(
      "getMemberStatistics",
      `
      WITH key_stats AS (
        SELECT
          COUNT(*) as total_keys,
          SUM(total_unlocks) as total_unlocks,
          MAX(last_used_at) as last_activity,
          COUNT(CASE WHEN status = 'active' AND expires_at > NOW() THEN 1 END) as active_keys,
          COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked_keys
        FROM inner_circle_keys
        WHERE member_id = $1
      ),
      recent_unlocks AS (
        SELECT
          DATE(unlocked_at) as date,
          COUNT(*) as daily_unlocks,
          COUNT(DISTINCT ip_address) as unique_ips
        FROM key_unlock_logs l
        JOIN inner_circle_keys k ON l.key_id = k.id
        WHERE k.member_id = $1
          AND l.unlocked_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(unlocked_at)
        ORDER BY date DESC
        LIMIT 30
      ),
      top_ips AS (
        SELECT
          ip_address,
          COUNT(*) as unlock_count,
          MAX(unlocked_at) as last_used
        FROM key_unlock_logs l
        JOIN inner_circle_keys k ON l.key_id = k.id
        WHERE k.member_id = $1
          AND ip_address IS NOT NULL
        GROUP BY ip_address
        ORDER BY unlock_count DESC
        LIMIT 10
      )
      SELECT
        m.*,
        ks.*,
        COALESCE(
          json_agg(
            json_build_object(
              'date', ru.date,
              'daily_unlocks', ru.daily_unlocks,
              'unique_ips', ru.unique_ips
            )
          ) FILTER (WHERE ru.date IS NOT NULL),
          '[]'::json
        ) as recent_activity,
        COALESCE(
          json_agg(
            json_build_object(
              'ip_address', ti.ip_address,
              'unlock_count', ti.unlock_count,
              'last_used', ti.last_used
            )
          ) FILTER (WHERE ti.ip_address IS NOT NULL),
          '[]'::json
        ) as top_ips
      FROM inner_circle_members m
      CROSS JOIN key_stats ks
      LEFT JOIN recent_unlocks ru ON true
      LEFT JOIN top_ips ti ON true
      WHERE m.id = $1
      GROUP BY m.id, ks.total_keys, ks.total_unlocks, ks.last_activity, ks.active_keys, ks.revoked_keys
      `,
      [memberId],
      null
    );
  }

  /**
   * Get system-wide analytics
   */
  static async getSystemAnalytics(period: AnalyticsPeriod) {
    return DatabaseClient.query(
      "getSystemAnalytics",
      `
      WITH period_series AS (
        SELECT generate_series(
          $1::timestamptz,
          $2::timestamptz,
          $3::interval
        ) as period
      ),
      member_growth AS (
        SELECT
          DATE_TRUNC($4, created_at) as period,
          COUNT(*) as new_members,
          SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC($4, created_at)) as total_members
        FROM inner_circle_members
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC($4, created_at)
      ),
      key_activity AS (
        SELECT
          DATE_TRUNC($4, unlocked_at) as period,
          COUNT(*) as unlocks,
          COUNT(DISTINCT key_id) as active_keys,
          COUNT(DISTINCT ip_address) as unique_ips
        FROM key_unlock_logs
        WHERE unlocked_at BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC($4, unlocked_at)
      ),
      key_status AS (
        SELECT
          status,
          COUNT(*) as count
        FROM inner_circle_keys
        GROUP BY status
      ),
      tier_distribution AS (
        SELECT
          tier,
          COUNT(*) as member_count,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_members
        FROM inner_circle_members
        GROUP BY tier
      )
      SELECT
        ps.period,
        COALESCE(mg.new_members, 0) as new_members,
        COALESCE(mg.total_members, 0) as total_members,
        COALESCE(ka.unlocks, 0) as unlocks,
        COALESCE(ka.active_keys, 0) as active_keys,
        COALESCE(ka.unique_ips, 0) as unique_ips,
        (
          SELECT json_object_agg(status, count)
          FROM key_status
        ) as key_statuses,
        (
          SELECT json_agg(
            json_build_object(
              'tier', tier,
              'member_count', member_count,
              'active_members', active_members
            )
          )
          FROM tier_distribution
        ) as tier_distribution
      FROM period_series ps
      LEFT JOIN member_growth mg ON mg.period = ps.period
      LEFT JOIN key_activity ka ON ka.period = ps.period
      ORDER BY ps.period
      `,
      [
        period.startDate,
        period.endDate,
        `1 ${period.interval}`,
        period.interval
      ],
      []
    );
  }

  /**
   * Search with advanced filters
   */
  static async advancedSearch(filters: QueryFilters, limit: number = 50, offset: number = 0) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build conditions dynamically
    if (filters.status) {
      conditions.push(`k.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.tier) {
      conditions.push(`m.tier = $${paramIndex}`);
      params.push(filters.tier);
      paramIndex++;
    }

    if (filters.dateFrom) {
      conditions.push(`k.created_at >= $${paramIndex}`);
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      conditions.push(`k.created_at <= $${paramIndex}`);
      params.push(filters.dateTo);
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(`(
        m.email_hash_prefix ILIKE $${paramIndex} OR
        m.name ILIKE $${paramIndex} OR
        k.key_suffix ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.memberId) {
      conditions.push(`m.id = $${paramIndex}`);
      params.push(filters.memberId);
      paramIndex++;
    }

    if (filters.ipAddress) {
      conditions.push(`(k.last_ip::text = $${paramIndex} OR k.created_by_ip::text = $${paramIndex})`);
      params.push(filters.ipAddress);
      paramIndex++;
    }

    if (filters.minUnlocks !== undefined) {
      conditions.push(`k.total_unlocks >= $${paramIndex}`);
      params.push(filters.minUnlocks);
      paramIndex++;
    }

    if (filters.maxUnlocks !== undefined) {
      conditions.push(`k.total_unlocks <= $${paramIndex}`);
      params.push(filters.maxUnlocks);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build the main query
    const query = `
      SELECT
        k.id as key_id,
        k.key_suffix,
        k.status as key_status,
        k.created_at as key_created,
        k.expires_at,
        k.total_unlocks,
        k.last_used_at,
        k.last_ip,
        k.revoked_at,
        k.revoked_by,
        k.revoked_reason,
        k.flags as key_flags,
        m.id as member_id,
        m.email_hash_prefix,
        m.name as member_name,
        m.tier as member_tier,
        m.status as member_status,
        m.last_seen_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('flag', f.flag)
          ) FILTER (WHERE f.flag IS NOT NULL),
          '[]'::json
        ) as member_flags,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'date', DATE(l.unlocked_at),
              'count', COUNT(*) OVER (PARTITION BY DATE(l.unlocked_at))
            )
          ) FILTER (WHERE l.id IS NOT NULL),
          '[]'::json
        ) as recent_unlocks
      FROM inner_circle_keys k
      JOIN inner_circle_members m ON k.member_id = m.id
      LEFT JOIN member_flags f ON m.id = f.member_id
      LEFT JOIN key_unlock_logs l ON k.id = l.key_id
        AND l.unlocked_at > NOW() - INTERVAL '7 days'
      ${whereClause}
      GROUP BY 
        k.id, k.key_suffix, k.status, k.created_at, k.expires_at, 
        k.total_unlocks, k.last_used_at, k.last_ip, k.revoked_at,
        k.revoked_by, k.revoked_reason, k.flags,
        m.id, m.email_hash_prefix, m.name, m.tier, m.status, m.last_seen_at
      ORDER BY k.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    return DatabaseClient.query(
      "advancedSearch",
      query,
      params,
      []
    );
  }

  /**
   * Get key usage heatmap data
   */
  static async getKeyUsageHeatmap(keyId: string, days: number = 30) {
    return DatabaseClient.query(
      "getKeyUsageHeatmap",
      `
      WITH hour_series AS (
        SELECT generate_series(
          0, 23, 1
        ) as hour
      ),
      date_series AS (
        SELECT generate_series(
          NOW() - INTERVAL '${days} days',
          NOW(),
          '1 day'::interval
        )::date as date
      ),
      actual_usage AS (
        SELECT
          DATE(unlocked_at) as date,
          EXTRACT(HOUR FROM unlocked_at) as hour,
          COUNT(*) as unlocks
        FROM key_unlock_logs
        WHERE key_id = $1
          AND unlocked_at > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(unlocked_at), EXTRACT(HOUR FROM unlocked_at)
      )
      SELECT
        ds.date,
        hs.hour,
        COALESCE(au.unlocks, 0) as unlocks,
        CASE
          WHEN COALESCE(au.unlocks, 0) = 0 THEN 'none'
          WHEN COALESCE(au.unlocks, 0) <= 5 THEN 'low'
          WHEN COALESCE(au.unlocks, 0) <= 20 THEN 'medium'
          ELSE 'high'
        END as intensity
      FROM date_series ds
      CROSS JOIN hour_series hs
      LEFT JOIN actual_usage au ON au.date = ds.date AND au.hour = hs.hour
      ORDER BY ds.date DESC, hs.hour
      `,
      [keyId],
      []
    );
  }

  /**
   * Get member retention metrics
   */
  static async getRetentionMetrics(cohortInterval: 'week' | 'month' = 'month') {
    return DatabaseClient.query(
      "getRetentionMetrics",
      `
      WITH member_cohorts AS (
        SELECT
          id as member_id,
          DATE_TRUNC($1, created_at) as cohort_period,
          DATE_TRUNC($1, last_seen_at) as last_seen_period
        FROM inner_circle_members
        WHERE created_at > NOW() - INTERVAL '1 year'
      ),
      period_series AS (
        SELECT DISTINCT cohort_period
        FROM member_cohorts
        ORDER BY cohort_period
      ),
      retention_data AS (
        SELECT
          c.cohort_period,
          COUNT(DISTINCT c.member_id) as cohort_size,
          COUNT(DISTINCT CASE 
            WHEN k.last_used_at >= c.cohort_period + INTERVAL '1 month' 
            THEN c.member_id 
          END) as retained_1m,
          COUNT(DISTINCT CASE 
            WHEN k.last_used_at >= c.cohort_period + INTERVAL '3 months' 
            THEN c.member_id 
          END) as retained_3m,
          COUNT(DISTINCT CASE 
            WHEN k.last_used_at >= c.cohort_period + INTERVAL '6 months' 
            THEN c.member_id 
          END) as retained_6m
        FROM member_cohorts c
        LEFT JOIN inner_circle_keys k ON c.member_id = k.member_id
        GROUP BY c.cohort_period
      )
      SELECT
        ps.cohort_period,
        COALESCE(rd.cohort_size, 0) as cohort_size,
        COALESCE(rd.retained_1m, 0) as retained_1m,
        COALESCE(rd.retained_3m, 0) as retained_3m,
        COALESCE(rd.retained_6m, 0) as retained_6m,
        ROUND(COALESCE(rd.retained_1m::decimal / NULLIF(rd.cohort_size, 0), 0) * 100, 2) as retention_1m_pct,
        ROUND(COALESCE(rd.retained_3m::decimal / NULLIF(rd.cohort_size, 0), 0) * 100, 2) as retention_3m_pct,
        ROUND(COALESCE(rd.retained_6m::decimal / NULLIF(rd.cohort_size, 0), 0) * 100, 2) as retention_6m_pct
      FROM period_series ps
      LEFT JOIN retention_data rd ON rd.cohort_period = ps.cohort_period
      ORDER BY ps.cohort_period DESC
      `,
      [cohortInterval],
      []
    );
  }

  /**
   * Detect suspicious activity patterns
   */
  static async detectSuspiciousActivity(threshold: number = 10) {
    return DatabaseClient.query(
      "detectSuspiciousActivity",
      `
      WITH recent_activity AS (
        SELECT
          k.member_id,
          l.ip_address,
          COUNT(*) as unlock_count,
          COUNT(DISTINCT DATE(l.unlocked_at)) as active_days,
          MIN(l.unlocked_at) as first_seen,
          MAX(l.unlocked_at) as last_seen,
          ARRAY_AGG(DISTINCT k.key_suffix) as keys_used,
          ARRAY_AGG(DISTINCT SUBSTRING(l.user_agent FROM '^[^/]+')) as user_agents
        FROM key_unlock_logs l
        JOIN inner_circle_keys k ON l.key_id = k.id
        WHERE l.unlocked_at > NOW() - INTERVAL '24 hours'
        GROUP BY k.member_id, l.ip_address
      ),
      member_stats AS (
        SELECT
          ra.*,
          m.email_hash_prefix,
          m.name,
          m.tier,
          m.status as member_status,
          (
            SELECT COUNT(*) 
            FROM key_unlock_logs l2
            JOIN inner_circle_keys k2 ON l2.key_id = k2.id
            WHERE k2.member_id = ra.member_id
              AND l2.unlocked_at > NOW() - INTERVAL '7 days'
          ) as weekly_unlocks
        FROM recent_activity ra
        JOIN inner_circle_members m ON ra.member_id = m.id
        WHERE ra.unlock_count >= $1
      ),
      flagged_activity AS (
        SELECT
          *,
          CASE
            WHEN unlock_count >= 100 THEN 'CRITICAL'
            WHEN unlock_count >= 50 THEN 'HIGH'
            WHEN unlock_count >= 20 THEN 'MEDIUM'
            ELSE 'LOW'
          END as severity,
          CASE
            WHEN array_length(user_agents, 1) > 3 THEN 'Multiple user agents'
            WHEN active_days = 1 AND unlock_count >= 50 THEN 'Burst activity'
            WHEN weekly_unlocks::decimal / NULLIF(unlock_count, 0) < 0.1 THEN 'Unusual pattern'
            ELSE 'High volume'
          END as pattern
        FROM member_stats
      )
      SELECT *
      FROM flagged_activity
      ORDER BY severity DESC, unlock_count DESC
      `,
      [threshold],
      []
    );
  }

  /**
   * Get top performers (most active members)
   */
  static async getTopPerformers(limit: number = 10, period: 'day' | 'week' | 'month' = 'week') {
    return DatabaseClient.query(
      "getTopPerformers",
      `
      WITH period_unlocks AS (
        SELECT
          k.member_id,
          COUNT(*) as unlock_count,
          COUNT(DISTINCT l.ip_address) as unique_ips,
          MAX(l.unlocked_at) as last_activity,
          ARRAY_AGG(DISTINCT k.key_suffix) as active_keys
        FROM key_unlock_logs l
        JOIN inner_circle_keys k ON l.key_id = k.id
        WHERE l.unlocked_at > NOW() - INTERVAL '1 ${period}'
        GROUP BY k.member_id
      ),
      member_info AS (
        SELECT
          pu.*,
          m.email_hash_prefix,
          m.name,
          m.tier,
          m.status,
          m.created_at as member_since,
          COALESCE(
            (SELECT SUM(total_unlocks) 
             FROM inner_circle_keys 
             WHERE member_id = pu.member_id),
            0
          ) as total_lifetime_unlocks
        FROM period_unlocks pu
        JOIN inner_circle_members m ON pu.member_id = m.id
      )
      SELECT *
      FROM member_info
      ORDER BY unlock_count DESC
      LIMIT $1
      `,
      [limit],
      []
    );
  }

  /**
   * Get key performance metrics
   */
  static async getKeyPerformanceMetrics(keyId: string) {
    return DatabaseClient.query(
      "getKeyPerformanceMetrics",
      `
      WITH key_info AS (
        SELECT
          k.*,
          m.email_hash_prefix,
          m.name as member_name,
          m.tier
        FROM inner_circle_keys k
        JOIN inner_circle_members m ON k.member_id = m.id
        WHERE k.id = $1
      ),
      hourly_pattern AS (
        SELECT
          EXTRACT(HOUR FROM unlocked_at) as hour_of_day,
          COUNT(*) as unlocks,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
        FROM key_unlock_logs
        WHERE key_id = $1
        GROUP BY EXTRACT(HOUR FROM unlocked_at)
        ORDER BY hour_of_day
      ),
      daily_trend AS (
        SELECT
          DATE(unlocked_at) as date,
          COUNT(*) as daily_unlocks,
          COUNT(DISTINCT ip_address) as unique_ips,
          ARRAY_AGG(DISTINCT SUBSTRING(user_agent FROM '^[^/]+/[^ ]+')) as user_agents
        FROM key_unlock_logs
        WHERE key_id = $1
          AND unlocked_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(unlocked_at)
        ORDER BY date DESC
      ),
      ip_analysis AS (
        SELECT
          ip_address,
          COUNT(*) as unlock_count,
          MIN(unlocked_at) as first_seen,
          MAX(unlocked_at) as last_seen,
          ARRAY_AGG(DISTINCT SUBSTRING(user_agent FROM '^[^/]+')) as user_agents
        FROM key_unlock_logs
        WHERE key_id = $1
          AND ip_address IS NOT NULL
        GROUP BY ip_address
        ORDER BY unlock_count DESC
        LIMIT 10
      )
      SELECT
        ki.*,
        (
          SELECT json_agg(
            json_build_object(
              'hour', hp.hour_of_day,
              'unlocks', hp.unlocks,
              'percentage', hp.percentage
            )
          )
          FROM hourly_pattern hp
        ) as hourly_pattern,
        (
          SELECT json_agg(
            json_build_object(
              'date', dt.date,
              'daily_unlocks', dt.daily_unlocks,
              'unique_ips', dt.unique_ips,
              'user_agents', dt.user_agents
            )
          )
          FROM daily_trend dt
        ) as daily_trend,
        (
          SELECT json_agg(
            json_build_object(
              'ip_address', ia.ip_address,
              'unlock_count', ia.unlock_count,
              'first_seen', ia.first_seen,
              'last_seen', ia.last_seen,
              'user_agents', ia.user_agents
            )
          )
          FROM ip_analysis ia
        ) as top_ips
      FROM key_info ki
      `,
      [keyId],
      null
    );
  }
}

export default InnerCircleQueries;