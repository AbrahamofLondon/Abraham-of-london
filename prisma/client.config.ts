// prisma/client.config.ts
import { defineClientConfig } from '@prisma/client';

export default defineClientConfig({
  adapter: {
    kind: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  },
  
  // Optional logging
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});