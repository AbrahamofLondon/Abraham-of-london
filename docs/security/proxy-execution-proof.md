# Proxy Execution Proof

Updated: 2026-05-07

## Framework fact

- Installed Next.js version: `16.2.3`
- Project root perimeter file: `proxy.ts`
- Root export present: `export async function proxy(req: NextRequest)`
- Root matcher present:

```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
```

## Current proof status

- `proxy.ts` is the active root perimeter file for this repository layout.
- Static build-time evidence confirms the project is configured around `proxy.ts`, not root `middleware.ts`.
- Runtime proof must be captured from a clean local start after the current hardening pass:
  1. `pnpm exec next build --webpack`
  2. `pnpm start -- --port 3199`
  3. request a matched route
  4. confirm proxy-applied headers or guarded redirect behavior

## Non-sensitive verification targets

- `/assets/downloads/<slug>.pdf` should redirect to `/api/downloads/<slug>`
- protected inner-circle routes should redirect to `/inner-circle/login` when unauthenticated
- common security headers should be present on matched responses

## Result

- Build-time proof: present
- Runtime proof: pending
