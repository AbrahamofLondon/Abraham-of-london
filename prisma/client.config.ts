// prisma/client.config.ts
import { defineClientConfig } from '@prisma/client';

export default defineClientConfig({
  // PostgreSQL via Neon — matches prisma/schema.prisma provider
  // No SQLite fallback. DATABASE_URL must be set.

  // Optional logging
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});
