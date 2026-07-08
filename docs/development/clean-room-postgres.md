# Clean-room local PostgreSQL setup

The Prisma schema is PostgreSQL-only. A clean checkout must not use SQLite URLs for `DATABASE_URL` or `DIRECT_URL`.

## Local database

Start the tracked PostgreSQL service. The host port is intentionally `55433` to avoid collisions with existing local PostgreSQL services on `5432`:

```powershell
docker compose up -d postgres
```

Use non-secret local credentials. Prisma CLI loads `.env`, so a clean-room run must create `.env` from the tracked template, not only `.env.local`:

```powershell`r`nCopy-Item .env.example .env`r`n``` `r`n`r`nThe relevant values are:`r`n`r`n```env`r`nDATABASE_URL="postgresql://aol:aol_local@127.0.0.1:55433/aol_dev?schema=public"`r`nDIRECT_URL="postgresql://aol:aol_local@127.0.0.1:55433/aol_dev?schema=public"`r`n```

## Fresh setup sequence

```powershell
Copy-Item .env.example .env`r`npnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec prisma db push --skip-generate
pnpm contentlayer2:build
pnpm exec tsc --noEmit --pretty false
pnpm exec vitest run
pnpm build
```

Do not use production Neon credentials for this proof. If Docker is unavailable, provide an equivalent local PostgreSQL 15+ database with the same database, user, password, and host port values above.`r`n`r`n## Migration-history note`r`n`r`n`prisma migrate deploy` is not currently the clean-room setup command. The current migration directory contains legacy SQLite-era / post-baseline migrations and no initial PostgreSQL baseline; replaying it from an empty PostgreSQL database fails before current schema creation. `pnpm exec prisma db push --skip-generate` is the tracked-source clean-room schema creation path until a dedicated PostgreSQL baseline migration is rebuilt and proven.
