# Evidence Consumption — Overclaim Corrections

> Date: 2026-05-08
> Purpose: Correct every overclaim found in prior closure reports.

---

## Corrections Required

| Original Claim | Where Stated | Truth | Correction |
|---------------|-------------|-------|-----------|
| "All six broken evidence links from the trace test are now closed" | evidence consumption closure pass report | Zero of six are fully closed to the user | Replace with: "Server-side evidence loading added for 3 links. Signal builder extended for 2 links. API created for 1 link. None render to the user yet." |
| "Team evidence -> Return Brief: RENDERED_AND_SOURCE_LABELLED" | closure pass classification table | Server loads but UI does not render | Downgrade to: PARTIALLY_CLOSED (server only) |
| "Enterprise strain -> Return Brief: RENDERED_AND_SOURCE_LABELLED" | closure pass classification table | Server loads but UI does not render | Downgrade to: PARTIALLY_CLOSED (server only) |
| "Consequence evidence -> Return Brief: RENDERED_AND_SOURCE_LABELLED" | closure pass classification table | Server builds messages but UI does not render | Downgrade to: PARTIALLY_CLOSED (server only) |
| "Team -> Oversight: SIGNAL_BUILT_AND_SOURCE_LABELLED" | closure pass classification table | Signal builder extended but composer never passes data | Downgrade to: ACCEPTS_INPUT_BUT_NOT_CONSUMED |
| "Enterprise -> Oversight: SIGNAL_BUILT_AND_SOURCE_LABELLED" | closure pass classification table | Signal builder extended but composer never passes data | Downgrade to: ACCEPTS_INPUT_BUT_NOT_CONSUMED |
| "no evidence vanishes silently" | closure pass final statement | Team, enterprise, and consequence evidence reach the server but vanish before the user | Replace with: "Core evidence chains (committed, competingObligation, verificationCriteria, PA evidence) are fully closed. Team, enterprise, and consequence evidence reach the server but are not yet rendered to users." |

---

## Language Audit

| Term | Found In | Classification | Correction |
|------|----------|---------------|-----------|
| "team reality" | Not in current server code | SAFE | — |
| "enterprise truth" | Not in current server code | SAFE | — |
| "verified team" | Not in current server code | SAFE | — |
| "confirmed enterprise" | Not in current server code | SAFE | — |
| "institutional memory" | docs only | NEEDS QUALIFIER | Add "where evidence chain is complete" |
| "fully consumed" | prior reports | OVERCLAIM | Replace with specific chain status |
| "never forgets" | not found in code | SAFE | — |
| "all evidence feeds" | not found in code | SAFE | — |
| "Earlier team reading reported" | return-brief.server.ts | SAFE | Appropriate wording — source-labelled |
| "Earlier enterprise reading reported" | return-brief.server.ts | SAFE | Appropriate wording — source-labelled |
| "You identified this financial consequence" | return-brief.server.ts | SAFE | User-reported, not system-verified |

---

## What IS Honestly Safe to Claim

1. "The system captures team, enterprise, and consequence evidence and prepares it for Return Brief delivery." — TRUE
2. "The system's signal builder can generate team divergence and enterprise strain signals when provided with data." — TRUE
3. "The Retainer Intake form collects governed oversight evidence and persists it securely." — TRUE
4. "Core evidence chains (committed flag, competing obligation, verification criteria, PA evidence, prior attempts, cost of delay) are fully wired from capture to user-facing display." — TRUE
5. "The Return Brief confronts the user with their prior verification standard, failure pattern, recurrence signal, and stop condition." — TRUE (via evidenceCarryForward block, lines 227-244)
