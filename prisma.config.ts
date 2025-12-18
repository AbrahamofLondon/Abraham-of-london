// prisma.config.ts
import { defineConfig } from 'prisma/config';
import path from 'path';

// We manually define the path to ensure the CLI cannot miss it
const dbPath = path.resolve(process.cwd(), 'dev.db');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // We hardcode the local file path for the CLI's sake
    url: `file:${dbPath}`,
  },
});