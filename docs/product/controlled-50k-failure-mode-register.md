# Controlled £50k Failure Mode Register

Generated: 2026-05-10

## Per-Surface Failure Modes

### Executive Reporting Result
| Mode | Risk | Mitigation |
|---|---|---|
| Runtime failure | ER run API fails or times out | Show "Assessment could not be completed" with retry |
| Credibility failure | Consequence pricing looks fabricated without context | Always show evidence basis and "estimate" caveat |
| Empty-state failure | No prior diagnostic data → thin ER | ER requires upstream diagnostic — guard prevents empty run |
| Access failure | Unauthenticated user reaches ER output | enforceExecutiveReportingAccess() checks ladder completion |
| Buyer objection | "How is this different from a consulting report?" | Emphasise deterministic system, not human opinion |

### Strategy Room Session
| Mode | Risk | Mitigation |
|---|---|---|
| Runtime failure | Session API returns 404 | "Session not found" with link back to strategy room |
| Credibility failure | Execution state looks empty or generic | Stakeholder pressure block hidden when thin |
| Empty-state failure | Session exists but no interventions/constraints | Shows decision frame without execution stack |
| Access failure | Token leaked in URL/referrer | Medium risk — token in query string. Use secure headers in future. |
| Buyer objection | "This is just a questionnaire with fancy UI" | Show checkpoint governance, cost tracking, confrontation loop |

### Boardroom
| Mode | Risk | Mitigation |
|---|---|---|
| Runtime failure | Institutional case resolver fails | Shows "No boardroom archive" — honest thin state |
| Credibility failure | Archive count is 0, no dossiers | Strong thin state: "appears only when conditions justify escalation" |
| Empty-state failure | First-time user sees empty boardroom | Explains qualification prerequisites clearly |
| Access failure | Respondent reaches boardroom | resolvePageAccess() + qualification gating prevents this |
| Buyer objection | "Where's the actual board deck?" | Explain dossier pathway — this is archive state, not PDF viewer |

### Oversight Command
| Mode | Risk | Mitigation |
|---|---|---|
| Runtime failure | buildSponsorSafeCommandSummary() fails | Returns null → "not yet established" thin state |
| Credibility failure | Health strip shows "WATCH" with no context | Health strip hidden when thinState is true |
| Empty-state failure | No retained oversight account | Strong thin state: "Start with diagnostic evidence..." |
| Access failure | Wrong role sees sponsor-safe data | deriveRetainedProductRole() + canViewSponsorCommandSummary() gating |
| Buyer objection | "This is just a status page" | Show cadence posture, case metrics, institutional memory |

### Oversight Brief
| Mode | Risk | Mitigation |
|---|---|---|
| Runtime failure | Cycle archive not found | "Oversight cycle could not be found" (weak — needs improvement) |
| Credibility failure | Brief has few signals, looks sparse | Sections only render when data exists — no faked sections |
| Empty-state failure | Brief is null | Shows blockedReason but no explicit thin state for null brief |
| Access failure | Non-member accesses org brief | Organisation membership check + retainer access verification |
| Buyer objection | "What am I paying for if the brief is this short?" | Show value-protected section, cancellation-loss section |

### Portfolio Memory
| Mode | Risk | Mitigation |
|---|---|---|
| Runtime failure | buildPortfolioMemory() fails | Shows "could not be assembled" — acceptable thin state |
| Credibility failure | Very few data points, patterns look random | sampleLimitation notice: "based on limited observations" |
| Empty-state failure | No diagnostic records in scope | Shows suppression notice and sample limitation |
| Access failure | Respondent sees portfolio | PORTFOLIO_VIEW permission required |
| Buyer objection | "There's nothing here" | Explain this grows with each retained cycle — it's memory, not a report |

### Counsel Status
| Mode | Risk | Mitigation |
|---|---|---|
| Runtime failure | loadCounselCaseForUser() fails | Shows "No counsel cases recorded" |
| Credibility failure | Status page with no cases looks pointless | Fair concern — this page is post-intake, not exploratory |
| Empty-state failure | No counsel case exists | Weak thin state — needs improvement |
| Access failure | Operator notes visible | CounselMemorySummary shows user-safe timeline only |
| Buyer objection | "Why do I need counsel if the system works?" | Explain: system identifies limits, counsel fills the gap |

### Proof Pack
| Mode | Risk | Mitigation |
|---|---|---|
| Runtime failure | generateProofPack() fails | Honest unavailable state |
| Credibility failure | Proof pack with no outcome history | Shows disclaimer: "not a substitute for verification" |
| Empty-state failure | No retained outcomes | Shows thin proof pack with available evidence only |
| Access failure | Unauthenticated access | resolvePageAccess() enforced |
| Buyer objection | "This doesn't prove anything" | Forward actions + evidence posture labels make it clear what IS and ISN'T proven |

### Admin Command Surface
| Mode | Risk | Mitigation |
|---|---|---|
| Runtime failure | Admin API fails | Individual page degrades; dashboard shows partial data |
| Credibility failure | Navigation has "rough"/"stub" badges visible | Honest labelling — better than hiding broken pages |
| Empty-state failure | Empty delivery queue, outcome ledger | Shows empty states honestly |
| Access failure | Non-admin accesses admin | requireAdminPage() with email whitelist + role check |
| Buyer objection | "The admin looks unfinished" | 8 high-value pages fully aligned; remaining pages functional |
