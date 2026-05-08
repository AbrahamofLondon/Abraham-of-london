# Strategy Room Route Integration Audit

**Date:** 2026-05-07

---

## App Router API Routes (15 — canonical)

| Route | Purpose | Admission enforced | Session source | Uses Living Case | Uses sessionStorage | Gaps |
|-------|---------|-------------------|---------------|-----------------|--------------------|----|
| `POST /api/strategy-room/execution` | Create execution session | YES — `evaluateStrategyRoomAdmission()` + `authorizeStrategyRoomEntry()` | Prisma | YES — queries journey | NO | None — fully enforced |
| `GET /api/strategy-room/execution` | List sessions | YES — `authorizeStrategyRoomEntry()` | Prisma | NO | NO | None |
| `GET /api/strategy-room/execution/[id]` | Fetch session + decisions | YES — `assertStrategyRoomAccess()` | Prisma | NO | NO | None |
| `PATCH /api/strategy-room/execution/[id]` | Update session | YES — `assertStrategyRoomAccess()` | Prisma | NO | NO | None |
| `/api/strategy-room/execution/[id]/decisions` | Decision log CRUD | YES — `assertStrategyRoomAccess()` | Prisma | NO | NO | None |
| `/api/strategy-room/execution/[id]/state` | State management | YES — `assertStrategyRoomAccess()` | Prisma | NO | NO | None |
| `/api/strategy-room/execution/locked-record` | Locked records | YES | Prisma | NO | NO | None |
| `POST /api/strategy-room/execution-record` | Persist execution records | Auth required | Prisma | NO | NO | None |
| `POST /api/strategy-room/session/init` | Init session with constitutional assembly | YES — `authorizeStrategyRoomEntry()` + `enforceStrategyRoomAccess()` (HARD GATE) | Prisma | NO | NO | None — fully enforced |
| `POST /api/strategy-room/session/impression` | Log impressions | Auth required | Prisma | NO | NO | None |
| `POST /api/strategy-room/session/click` | Log clicks | Auth required | Prisma | NO | NO | None |
| `/api/strategy-room/session/conversion` | Track conversion | Auth required | Prisma | NO | NO | None |
| `/api/strategy-room/session/followup` | Post-session followup | Auth required | Prisma | NO | NO | None |
| `GET /api/strategy-room/results` | Fetch results | Auth required | Prisma | NO | NO | None |
| `/api/strategy-room/briefing/return/[sessionId]` | Return Brief | YES — `assertStrategyRoomAccess()` | Prisma | NO | NO | None |

## Pages Router API Routes (7 — legacy)

| Route | Purpose | Status |
|-------|---------|--------|
| `pages/api/strategy-room/submit.ts` | Structured form adapter | LEGACY — may be used by older form |
| `pages/api/strategy-room/analyze.ts` | Analysis endpoint | LEGACY |
| `pages/api/strategy-room/enrol.ts` | Enrollment | ACTIVE — calls `processStrategyRoomEnrolment()` |
| `pages/api/strategy-room/intake.ts` | Intake collection | LEGACY |
| `pages/api/strategy-room/export/[slug].ts` | Export | SUPPORTING |

## UI Routes

| Route | Purpose | Renders execution command | Uses server data | Uses sessionStorage |
|-------|---------|--------------------------|-----------------|-------------------|
| `/strategy-room` (`pages/strategy-room/index.tsx`) | Main entry — gate + execution chamber | YES — 10+ execution command components | YES (getServerSideProps + API calls) | YES (tension thread as supplement, server is sovereign) |
| `/strategy-room/session/[id]` (`pages/strategy-room/session/[id].tsx`) | Session detail | YES — ReturnBriefInterruptionBar | YES | Minimal |
| `/strategy-room/success` (`app/strategy-room/success/page.tsx`) | Post-payment success | NO — only shows readiness score | YES — fetches from results API | NO |

---

## Admission enforcement summary

| Gate | Location | Type | Status |
|------|----------|------|--------|
| `evaluateStrategyRoomAdmission()` | execution/route.ts POST | Evidence + authority + decision | ACTIVE |
| `authorizeStrategyRoomEntry()` | execution/route.ts, session/init | Token + identity + entitlement | ACTIVE |
| `enforceStrategyRoomAccess()` | session/init | Durable thread (block/restrict) | ACTIVE |
| `assertStrategyRoomAccess()` | execution/[id]/* routes | Session ownership | ACTIVE |

All four admission gates are active. No ungoverned route exists.
