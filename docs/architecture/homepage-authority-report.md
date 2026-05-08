# Homepage Authority Report

Generated: 2026-05-07

## Answer

- Current `/` authority: `pages/index.tsx`
- `app/page.tsx`: missing
- Root `homepage.html`: present in the repository root but not part of Next.js routing
- Static override risk: low under current config, but the root HTML file is a repository hygiene hazard because it can be mistaken for live authority

## Evidence

- `pages/index.tsx` exists and is the only canonical homepage source file in the Next.js routers.
- `app/page.tsx` is absent, so the app router does not define `/`.
- `netlify.toml` redirects `/index.html` to `/`, which reinforces the Next route rather than the root HTML file.
- `next.config.mjs` does not introduce a rewrite that overrides `/`.
- `homepage.html` sits at repo root, outside `public/`, so it is source-controlled but not served by the standard Next.js route tree.

## Conclusion

`/` is currently served by the pages router via `pages/index.tsx`. The homepage is source-controlled and aligned with Next.js routing, but the repository contains a misleading static artifact (`homepage.html`) that should be archived or clearly marked non-authoritative.

## Safest Canonical Implementation Path

1. Keep `pages/index.tsx` as the active homepage until a deliberate app-router migration is assigned.
2. Do not introduce `app/page.tsx` in this hardening pass, because it would change homepage authority and risks destabilising a working route.
3. Move or archive `homepage.html` so it cannot be mistaken for live route authority.
4. If a future migration is required, create `app/page.tsx` only after a planned cutover and remove duplicate homepage authority explicitly.
