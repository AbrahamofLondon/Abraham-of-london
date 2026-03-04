BEGIN;

DELETE FROM _prisma_migrations
WHERE migration_name IN (
  '20260303104923_enterprise_schema_upgrade',
  '20260303105345_normalize_access_tier_values'
);

COMMIT;