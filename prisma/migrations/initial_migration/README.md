# Initial Database Migration

This migration creates all tables defined in the Prisma schema for the Abraham of London platform.

## Tables Created

1. `download_audit_events` - Track all download activities
2. `short_interactions` - User interaction tracking
3. `strategy_room_intakes` - Strategy room submissions
4. `inner_circle_members` - Member profiles and authentication
5. `inner_circle_keys` - API keys and access tokens
6. `content_metadata` - Content catalog and metadata
7. `content_access` - Content access permissions
8. `sessions` - User sessions
9. `system_audit_logs` - System audit trail
10. `api_rate_limits` - API rate limiting
11. `cache_entries` - Application cache
12. `system_configs` - System configuration
13. `failed_jobs` - Failed background jobs
14. `maintenance_logs` - Maintenance operations

## Indexes

All tables include appropriate indexes for:
- Primary key lookups
- Foreign key relationships
- Common query patterns
- Time-based queries
- Status-based filtering

## Constraints

- Unique constraints on email hashes and slugs
- Foreign key constraints for data integrity
- Check constraints for data validation