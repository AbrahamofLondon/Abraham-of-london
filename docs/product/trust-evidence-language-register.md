# Trust, Evidence & Language Register

**Date:** 2026-05-09
**Purpose:** Canonical vocabulary and phrasing rules for all public, client-facing, and operator-facing surfaces.

---

## 1. Evidence Posture Vocabulary

Every evidence claim must carry one of these posture labels. No exceptions.

| Posture | Definition | Example usage |
|---------|-----------|---------------|
| `USER_REPORTED` | Stated by the user during intake or assessment | "Based on your stated decision context" |
| `SYSTEM_INFERRED` | Computed by the system from user inputs | "System-inferred from your assessment responses" |
| `ESTIMATED` | Projected from stated inputs, not measured | "Estimated exposure based on stated inputs" |
| `AGGREGATED` | Combined from multiple user-reported inputs | "Aggregated from N respondents" |
| `OPERATOR_REVIEWED` | Reviewed by a human operator | "Reviewed by a qualified analyst" |
| `COUNSEL_REVIEWED` | Reviewed through governed counsel process | "Reviewed through counsel escalation" |
| `VERIFIED` | Confirmed by evidence beyond self-report | "Verified against documented outcomes" |
| `INSUFFICIENT_EVIDENCE` | Not enough data to classify | "Insufficient evidence to determine" |
| `SUPPRESSED` | Withheld for privacy, entitlement, or safety | "Detail withheld to preserve privacy" |

### Rules
- `VERIFIED` must NEVER be applied to self-reported outcomes. Use `USER_REPORTED` instead.
- `VERIFIED` requires at least one of: documentary evidence, operator confirmation, or outcome measurement.
- When in doubt, use `SYSTEM_INFERRED` rather than `VERIFIED`.
- Always state the source alongside the posture: "Source: Fast Diagnostic — Evidence posture: user-reported."

---

## 2. Source Label Rules

Every governed output must carry:

1. **Source** — which instrument or surface produced the evidence
2. **Date** — when the evidence was captured
3. **Evidence posture** — from the vocabulary above
4. **Respondent count** — if aggregated (e.g., "3 respondents")

### Canonical format
```
Source: {instrument name} — Evidence posture: {posture}
```

Example: `Source: Team Assessment — 4 respondents — Evidence posture: aggregated`

---

## 3. Allowed Phrases

These phrases are approved for public use across all surfaces.

### Product identity
- "Decision Infrastructure by Abraham of London"
- "A governed decision institution"
- "Decision Infrastructure"

### System capability
- "The system records, remembers, and follows up."
- "The system does not fabricate checkpoints, evidence, or outcomes."
- "The system does not invent certainty."
- "The system can refuse to proceed."
- "The system refuses to proceed when evidence is insufficient."
- "Nothing resets. Evidence carries forward."
- "Contradictions accumulate. The system does not forget."

### Evidence and trust
- "Every piece of evidence is labelled: who stated it, when, and how it was captured."
- "Where confidence is partial, the system says so."
- "It does not claim a verified outcome unless evidence is actually provided."
- "These consequences have not been independently verified."
- "Based on your stated decision context and declared consequence."
- "Scenario only — not a financial forecast."
- "This is an estimate, not a verified external fact."
- "Self-reported evidence is never represented as independently verified."

### Earned progression
- "Your evidence now supports a deeper report."
- "You can proceed, or keep the current checkpoint active."
- "Evidence threshold met."
- "Not yet earned by evidence."
- "Eligible based on current evidence."

### Counsel
- "Counsel review is available when the evidence shows automated analysis should not proceed alone."
- "Counsel Review is not a starting point."
- "Counsel is warranted by the evidence."
- "The cases the system should not pretend to resolve alone."

### Governance
- "Every governed output can be challenged."
- "Challenges enter the case record."
- "No sale if the case is not ready."
- "Durable proof, not performance theatre."

---

## 4. Prohibited Phrases

These phrases must NOT appear in any public or client-facing surface.

### Generic marketing
| Phrase | Why prohibited | Replace with |
|--------|---------------|-------------|
| "AI-powered" | Frames product as AI wrapper | Remove or use "governed" |
| "data-driven" | Generic SaaS language | "evidence-led" |
| "smarter insights" | Soft marketing | "governed readings" |
| "transform your decisions" | Motivational, not institutional | Describe specific mechanism |
| "unlock" | SaaS paywall language | "access" or "enter" |
| "Upgrade Now" | Purchase framing | "Evidence threshold met" or describe what was earned |
| "solution" | Consulting language | "intervention" or "directed action" |
| "dashboard" (for the product) | Passive data viz framing | "Decision Centre" or "case console" |
| "tool" (for the product) | Diminishes institutional identity | "instrument" or "system" |
| "insight" / "insights" | Soft, passive | "reading" or "interpretation" or "signal" |
| "clarity" (as marketing adjective) | Generic | "precision" or "position confidence" |
| "success rate" | Overclaim without evidence | Remove or cite specific evidence |

### Identity violations
| Phrase | Why prohibited | Replace with |
|--------|---------------|-------------|
| "consulting" (as product identity) | Product is not a consultancy | "Decision Infrastructure" or "counsel" |
| "advisory" (as product identity) | Product is not advisory | "governance" or "operator review" |
| "Institutional Platform" | Generic enterprise SaaS | "Decision Infrastructure" |
| "platform for disciplined thinking" | Content brand, not governance | Decision Infrastructure description |
| "strategy services" | Consulting language | Describe specific mechanism |
| "Decision Authority as a Service" | Service framing contradicts institution identity | "Retained Decision Enforcement" |

### Overclaim
| Phrase | Why prohibited | Replace with |
|--------|---------------|-------------|
| "verified" (for self-reported) | Self-report is not verification | "user-reported" or "reported" |
| "guarantee" (positive claim) | Unsubstantiated | Remove or use "governed commitment" |
| "the system has determined" | Systems infer, not determine | "the evidence supports" |
| "board-grade clarity" | Vague marketing | "board-grade decision object" |
| "proven" (without evidence chain) | Overclaim | "demonstrated" or "observed" |
| "trusted by" (without evidence) | Requires verifiable client list | Remove or cite specific evidence |

### IP exposure
| Phrase | Why prohibited | Replace with |
|--------|---------------|-------------|
| "kernel" | Internal architecture name | Remove entirely |
| "graph mechanics" / "evidence graph" | Internal data structure | "evidence record" |
| "arbiter rules" | Internal system name | "internal review" or "quality check" |
| "scoring formula" / "weights" | Internal mechanics | Remove entirely |
| "prompt structure" | Reveals AI implementation | Remove entirely |
| "algorithm" | Internal mechanics | "system" or "method" |
| "decay algorithm" | Internal mechanics | Remove entirely |
| "threshold" (with specific values) | Reveals gating parameters | Use qualitative framing |
| "tournament mechanics" | Internal architecture | "internal validation" |
| "V2.2 sovereign routing kernel" | Literal internal component name | Remove entirely |
| "confidence score" (with formula) | Reveals scoring model | "confidence level" |

---

## 5. Estimated vs Reported vs Verified Rules

| When the evidence is... | Say... | Never say... |
|------------------------|--------|-------------|
| User typed it in | "Based on your stated inputs" | "Verified" |
| System computed from user input | "System-inferred from your responses" | "Determined" or "proven" |
| Financial projection from stated data | "Estimated exposure" / "Scenario only" | "Priced" or "costed" |
| User self-reported outcome | "User-reported outcome" | "Verified outcome" |
| Operator reviewed the case | "Operator-reviewed" | "Independently verified" |
| Counsel reviewed the case | "Counsel-reviewed" | "Certified" |
| Documentary evidence provided | "Supported by documentation" | "Proven" (unless legal) |
| No data available | "Insufficient evidence" | "Pending verification" |

---

## 6. Counsel / Oversight / Boardroom Wording Rules

| Concept | Correct framing | Incorrect framing |
|---------|----------------|-------------------|
| Counsel access | "Counsel is warranted by the evidence" | "Book advisory support" / "Available for purchase" |
| Counsel identity | "Governed escalation" | "Consulting" / "Advisory engagement" |
| Counsel output | "Counsel position" or "counsel response" | "Recommendation" |
| Oversight | "Retained decision enforcement" | "Decision Authority as a Service" |
| Boardroom | "Boardroom readiness — earned by evidence" | "Premium tier" / "Upgrade to boardroom" |
| Boardroom access | "Not yet qualified — evidence missing" | "Locked — purchase required" |

---

## 7. Pricing / Admission Wording Rules

| Concept | Correct framing | Incorrect framing |
|---------|----------------|-------------------|
| Paid product appears | "Your evidence now supports this step" | "Upgrade" / "Unlock" / "Buy now" |
| Product not available | "Not yet earned by evidence" | "Locked" / "Premium only" |
| System refuses sale | "The case is not ready" | "Try again later" |
| Free to paid transition | "Earned next step" | "Recommendation" / "Suggested upgrade" |
| Stopping is valid | "Your current finding and checkpoint remain active" | (omit mention of stopping) |
