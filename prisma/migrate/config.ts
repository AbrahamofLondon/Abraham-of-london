// prisma/migrate/config.ts
import { defineConfig } from '@prisma/migrate'

export default defineConfig({
  datasourceUrl: process.env.DATABASE_URL,
})