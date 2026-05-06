# Red-Team Runbook

Run `node scripts/security/red-team-smoke.mjs` with `TARGET_URL` pointed at a local or deployed environment.

## Covered checks

1. Mutate a Strategy Room `sessionId` and confirm access is denied without ownership or signed access token.
2. Call `/api/cron/decision-state` without `Authorization: Bearer CRON_SECRET` and expect `401`.
3. Call `/api/cron/decision-state?dryRun=true` with a valid bearer token and confirm the response is dry-run only.
4. Submit rapid repeated requests to `/api/diagnostics/score` and confirm rate limiting or shield degradation.
5. Submit malformed JSON payloads to `/api/diagnostics/score` and `/api/diagnostics/challenge` and confirm `400` or `415`.
6. Attempt repeated purpose-alignment email capture and confirm rate limiting.
7. Attempt unsubscribe enumeration and confirm generic response text.
8. Attempt delete without proof or same-origin context and confirm `403`.
9. Attempt checkout tampering by changing `slug` or supplying `userId` client-side and confirm server-side authority.
10. Attempt direct PDF traversal or unauthorized slug access and confirm denial.
11. Scan `.next/static` and `.next/server` with the client bundle audit for forbidden strings.
12. Verify response headers include CSP, HSTS, frame denial, nosniff, permissions policy, COOP, and CORP.

## Manual follow-up still required

- Stripe webhook replay and idempotency verification against a non-production Stripe endpoint.
- Netlify scheduler invocation with production environment variables.
- Full legacy Pages Router admin surface normalization.
