# Content Persistence — Tracked Follow-ups

Tracking for the content-persistence fix (Approach A: per-route `outputFileTracingIncludes`
generated from `lib/content/route-content-types.mjs`). See `next.config.mjs` header and
`scripts/check-content-route-tracing.mjs` for the full rationale.

---

## CONTENT-PERSIST-1 — Set the MEASURED handler-size threshold after first real deploy

**Status:** OPEN
**Owner:** Abraham of London (deploy approver)
**Opened:** 2026-06-17
**Trigger:** The first real Netlify production deploy that includes the
`outputFileTracingIncludes` content entries (commit lands on `main` and Netlify
publishes it).

### Why this exists
Local `netlify build` (broken `ajv-errors` dep) and local `next build` standalone
emission are both unavailable on the dev machine, so the **authoritative** zipped
serverless-handler size can only be measured at the real Netlify build. Until then,
`scripts/check-content-persistence.mjs` runs a **PLATFORM-BOUND** check (handler ≤ 45 MB
= Netlify 50 MB limit − 5 MB headroom) and says so explicitly in its output. Measured
context so far: content `_index.json` contribution = **16.19 MB zipped** (all types),
single-handler model; corpus total 64.57 MB uncompressed.

### How this surfaces (so it does not sit unread)
This file does **not** notify anyone on its own. The actual mechanism is
`scripts/check-content-persistence.mjs`, which is **both** the post-deploy
verification and the scheduled monitor. While `reports/content-handler-size.json`
is absent it prints a loud, boxed **`⚠ ACTION REQUIRED: CONTENT-PERSIST-1`** banner
with the exact steps below — on every run, including the first verification run
*after* the triggering deploy. Writing the baseline file **self-clears** the banner.
(The script is intentionally NOT wired into `package.json` here — that file is
managed by a concurrent process; attaching the script to a scheduler is the open
owner decision in the Monitoring section.)

### Steps to close
1. After the first deploy with the tracing config publishes, read the real **zipped
   server-handler size** from the Netlify deploy logs / function bundle.
2. Write `reports/content-handler-size.json`:
   `{ "handlerZippedMB": <number>, "deploy": "<date>", "commit": "<sha>" }`.
   `scripts/check-content-persistence.mjs` automatically switches from the PLATFORM-BOUND
   message to a **MEASURED CHECK** (threshold = measured × 1.2) once this file exists.
3. Record the measured number in the **deploy report** (the format already used for these
   builds), where a human reads it without digging.
4. Confirm `scripts/check-content-persistence.mjs` passes against the live deploy (the
   short/brief/library persistence check is stable across 0s/60s/5min — content does not
   vanish after the ISR revalidation window).
5. Close this follow-up.

---

## Monitoring — scheduled content-presence check

`scripts/check-content-persistence.mjs` is the monitoring mechanism (per the brief's
"scheduled job that periodically fetches 3–5 known content routes and alerts if any
return empty/404"). It is NOT wired into `/api/health`: that endpoint's function is not in
the tracing SSOT, so calling the content loaders in-process there would see an empty
registry and false-alarm.

**To wire (low-risk, no app-code change):** run
`node scripts/check-content-persistence.mjs` on a schedule against production (e.g. a
Netlify scheduled function, GitHub Action cron, or the existing cron infra under
`pages/api/cron/`). It exits non-zero + prints which route returned empty/404, so any
scheduler that alerts on non-zero exit surfaces a recurrence automatically — rather than
waiting for someone to notice missing content.

Owner decision still open: which scheduler to attach it to (CI cron vs Netlify scheduled
function). Defaulting to none until chosen; the script is ready either way.
