# Legacy Route Retirement Plan

> Rules: No route remains just because it exists. No symbolic route without function. No dead dashboard. No null route without redirect.

## Immediate Retirement (P1)

| Route | Reason | Action |
|-------|--------|--------|
| `/app/dashboard/purpose-alignment` | Code says "marked for deletion" | Delete file |
| `/board/c.tsx` | Returns null, redirects to /admin | Delete after confirming redirect works |
| `/board/dashboard.tsx` | Returns null, redirects to /admin | Delete |
| `/board/intelligence.tsx` | Returns null, redirects to /admin | Delete |
| `/client/dashboard.tsx` | Returns null, redirects to /admin | Delete |
| `/dev/dashboard.tsx` | Returns null, redirects to /admin | Delete |
| `/directorate/oversight.tsx` | Returns null, redirects to /admin | Delete |
| `/resources/board-decision-log-template.tsx` | Redirects to /admin | Delete |

## Route Merges (P2)

| Keep | Redirect from | Reason |
|------|--------------|--------|
| `/terms-of-service` | `/terms` | Duplicate legal page |
| `/cookie-policy` | `/cookies` | Duplicate |
| `/security` | `/security-policy` | Duplicate |
| `/accessibility` | `/accessibility-statement` | Duplicate |
| `/diagnostics/enterprise-assessment` | `/diagnostics/enterprise` | Duplicate entry |
| `/diagnostics/team-assessment` | `/diagnostics/team-alignment` | Duplicate entry |
| `/strategy-room` | `/consulting/strategy-room` | Duplicate marketing page |
| `/diagnostics/purpose-alignment` | `/app/purpose-alignment` | Canonical is pages router |

## Evaluate (P3)

| Route | Question |
|-------|----------|
| `/diagnostics/directional-integrity` | Is this distinct from constitutional? If not, merge. |
| `/shorts/index.migrated.tsx` | Legacy file. Safe to delete? |
| `/content/simple.tsx` | What uses this? |
| `/debug/content.tsx` | Dev-only. Keep behind NODE_ENV gate. |
| `/test-readers.tsx` | Dev-only. Keep behind NODE_ENV gate. |
| `/controls.tsx` | What is this? Evaluate. |

## Implementation Notes

- All redirects should use 308 (permanent) to preserve SEO
- Delete files only after confirming the redirect is in place via proxy.ts or next.config.mjs
- Keep redirect rules for at least 90 days before removing the source file
- Update sitemap generators to exclude retired routes
