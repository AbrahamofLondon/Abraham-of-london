import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // This connects the CLI to your actual database URL
    url: process.env.INNER_CIRCLE_DB_URL || process.env.DATABASE_URL
  }
});