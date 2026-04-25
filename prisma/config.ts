// prisma/config.ts
import { defineConfig } from '@prisma/migrate';

export default defineConfig({
  // PostgreSQL via Neon — no SQLite fallback
  datasourceUrl: process.env.DATABASE_URL,
});
