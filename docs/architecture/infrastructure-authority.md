# ADR — Infrastructure authority (Neon first, Upstash optional)

**Status:** Accepted. Binding rule for all agents. Do not redesign the stack around Upstash.

## Rule
```
SYSTEM OF RECORD / DURABLE STATE   → Neon PostgreSQL (DATABASE_URL / DIRECT_URL)
DISTRIBUTED RATE LIMITING          → Neon/Postgres bucket authority by DEFAULT
UPSTASH / REDIS                    → OPTIONAL acceleration, ONLY when explicitly enabled
MEMORY                             → local development and tests only
```

- **Neon PostgreSQL is the single durable authority** for all customer/system-of-record
  state (Pilot, Signal consent/continuation, corridor context, funnel telemetry buckets,
  and the decision record).
- **Upstash/Redis is not the assumed production authority.** It is an optional
  acceleration/cache/rate-limit provider, activated **only** by an explicit switch —
  `RATE_LIMIT_BACKEND=upstash` (or `=redis`). The mere *presence* of `UPSTASH_*` /
  `REDIS_*` credentials must never auto-promote them to authority, because that would
  silently change the production store and the operating cost.
- **In-memory is never a silent production authority** — it is local/dev/test only and
  warns (and fails closed) if it is ever hit in production.

This preserves the provider abstraction and a clean future switch to Upstash under the
same application contract, without increasing today's operating cost.

## Rate-limit resolution order (implemented)
`lib/server/security/rate-limit-provider.ts`:
```
0. explicit acceleration ONLY if RATE_LIMIT_BACKEND=upstash|redis
1. PostgreSQL (Neon)   ← default durable authority
2. in-memory           ← local/dev/test fallback (warns + failClosed in production)
```

## Telemetry must never block the customer journey
Rate limiting / telemetry storage is **non-critical** relative to the customer's actual
Decision Signal or Operator Pilot action. Invariant:

> A limiter or telemetry-storage outage may cause the telemetry event to fail
> independently or be classified untrusted. It must **never** block the customer's
> decision/pilot interaction.

How this is enforced today:
- **Client:** `lib/demo/record-journey-event.ts` posts via `sendBeacon`/keepalive `fetch`,
  fire-and-forget; the page never awaits it.
- **Server-inline:** journey routes wrap `recordFunnelEvent(...)` in `try/catch`
  ("analytics cannot block intake").
- **Endpoint:** `/api/demo/funnel-event` may fail closed for *abuse prevention of the
  public endpoint*; because the customer path does not depend on its response, this does
  not block the journey. (Product option: classify as `untrusted` and still record rather
  than 429, to avoid losing legitimate telemetry.)

## Do not
- Configure Upstash as the assumed production rate-limit/authority backend.
- Move durable customer state off Neon PostgreSQL.
- Let telemetry `failClosed` propagate into the customer decision/pilot path.
