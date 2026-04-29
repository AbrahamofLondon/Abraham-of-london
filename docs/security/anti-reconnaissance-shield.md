# Anti-Reconnaissance Shield v1

## Architecture

```
Edge proxy (proxy.ts)
→ Persistent Redis/Postgres rate limit
→ Anti-Reconnaissance Shield
  ├── IP Abuse Watchdog (behavioural analysis)
  ├── Canary Diagnostics (tripwire detection)
  ├── Adaptive Response (combined verdict)
  └── Evidence Vault (append-only forensic store)
→ Scoring / Auth API
→ Public-safe DTO
```

## Components

### IP Abuse Watchdog (`ip-abuse-watchdog.server.ts`)
- Detects: submission speed, request frequency, input variation patterns, output harvesting, suspicious user agent
- Postgres models: AbuseEvent, AbuseFingerprint, AbuseDecision, BlockedIdentity
- Response ladder: L0 allow → L1 slow → L2 verify → L3 degrade → L4 temp block → L5 perm block

### Canary Diagnostics (`canary-diagnostics.server.ts`)
- Detects: hidden-field submission, decoy parameter usage, abnormal API sequencing, near-duplicate systematic requests, multi-account fingerprint
- Postgres model: CanaryTripwire
- Tripwires are invisible to genuine users — only automated scripts trigger them

### Adaptive Response (`adaptive-response.server.ts`)
- Combines watchdog + canary signals into unified threat score
- Produces single ShieldVerdict: allowed, action, delayMs, degradeResponse
- Records evidence for significant events

### Evidence Vault (`evidence-vault.server.ts`)
- Append-only forensic evidence store
- Postgres model: EvidenceVaultEntry (immutable by default)
- Used for: legal enforcement, IP theft prosecution, pattern analysis
- Provides: evidence trail per identity, summary dashboard

### Shield Middleware (`shield-middleware.ts`)
- Reusable integration helper for both Pages Router and App Router
- `applyShield(req, route)` for Pages Router
- `applyShieldFromRequest(request, route)` for App Router

## Protected Routes

| Route | Type | Shield Integration |
|-------|------|-------------------|
| `/api/diagnostics/score` | Pages Router | Full shield with degradation |
| `/api/auth/sovereign` | App Router | Shield before rate limit |
| `/api/inner-circle/verify` | App Router | Shield before rate limit |
| `/api/inner-circle/issue` | App Router | Shield before rate limit |
| `/api/admin/auth/send-link` | Pages Router | Shield before rate limit |
| `/api/admin/dev-login` | App Router | Shield after dev-only gate |

## Response Behaviour

| Level | Action | User sees | Attacker learns |
|-------|--------|-----------|-----------------|
| 0 | Allow | Normal response | Nothing |
| 1 | Slow | Normal response (1.5s delay) | Nothing |
| 2 | Verify | "Additional verification required" (3s delay) | Something triggered, but not what |
| 3 | Degrade | Reduced-detail response | Less useful data, but not why |
| 4 | Block (temp) | "Please try again later" | They are blocked, but not why or for how long |
| 5 | Block (perm) | "Please try again later" | Same as L4 — no distinction visible |

## Critical Rules

1. Never reveal which rule triggered
2. Never reveal what threshold was crossed
3. Never reveal what behaviour caused the decision
4. Never reveal whether the user is being monitored
5. Postgres is authority — Redis is optional cache
6. All evidence is server-side only — no client exposure
7. Genuine users are never affected unless confidence is high
