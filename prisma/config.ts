// prisma/config.ts
import { defineConfig } from 'prisma';
import { config } from 'dotenv';

config({ path: '.env' });

export default defineConfig({
  datasource: {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  generators: [
    {
      name: 'client',
      provider: 'prisma-client-js',
    },
  ],
});