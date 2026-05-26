# Market Readiness Gate

Readiness is tied to the Netlify parity build, not a plain local build.

Run:

```bash
pnpm build:netlify
node scripts/market-readiness-gate.mjs
```

The gate requires:

- `pnpm build:netlify` has completed and written `.netlify/aol-parity-build.json`.
- `.netlify` output exists.
- `.next/BUILD_ID` and `.next/server` exist.
- `DATABASE_URL` is present.
- Product, admin, and commercial-critical routes resolve on disk.
- Pages Router SSG files do not import unsafe MDX runtime code.
- App Router `page.tsx` files do not directly use `useSearchParams`.
- Local and aliased imports resolve with exact Linux file casing.

No Netlify parity build, no readiness claim.
