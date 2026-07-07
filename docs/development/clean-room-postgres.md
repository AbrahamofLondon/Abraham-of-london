# Clean-room local PostgreSQL setup

The Prisma schema is PostgreSQL-only. A clean checkout must not use SQLite URLs for `DATABASE_URL` or `DIRECT_URL`.

## Local database

Start the tracked PostgreSQL service:

```powershell
docker compose up -d postgres
```

Use non-secret local credentials:

```env
DATABASE_URL="postgresql://aol:aol_local@localhost:5432/aol_dev?schema=public"
DIRECT_URL="postgresql://aol:aol_local@localhost:5432/aol_dev?schema=public"
```

## Fresh setup sequence

```powershell
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm contentlayer2:build
pnpm exec tsc --noEmit --pretty false
pnpm exec vitest run
pnpm build
```

Do not use production Neon credentials for this proof. If Docker is unavailable, provide an equivalent local PostgreSQL 15+ database with the same database, user, and password values above.