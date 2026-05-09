# Counsel Room — Current State Audit

**Date:** 8 May 2026
**Method:** File-level audit of every consulting/advisory/counsel surface.

---

## Surface Inventory

| Route | File | Classification |
|-------|------|---------------|
| `/consulting` | `pages/consulting/index.tsx` | `BROCHURE` — static marketing page with evidence carry-forward recently added but core still brochure |
| `/consulting/interventions` | `pages/consulting/interventions.tsx` | `OPERATOR_ONLY` — admin-grade intervention tracking surface |
| `/consulting/strategy-room` | `pages/consulting/strategy-room.tsx` | `LEGACY_MARKETING` — permanent redirect to `/strategy-room` |
| `/contact` | `pages/contact.tsx` | `CONTACT_FORM` — generic contact form with advisory options |
| `/admin/counsel-review` | `pages/admin/counsel-review.tsx` | `OPERATOR_ONLY` — admin counsel review assignment |
| `/admin/oversight-review` | `pages/admin/oversight-review.tsx` | `OPERATOR_ONLY` — admin oversight with counsel escalation |
| `/private-clients` | `pages/private-clients/index.tsx` | `LEGACY_MARKETING` — static private client page |
| `/strategy-room` | `pages/strategy-room/index.tsx` | `SYSTEM_ESCALATION` — governed escalation with enforcement state |
| `/strategy-room/session/[id]` | `pages/strategy-room/session/[id].tsx` | `SYSTEM_ESCALATION` — active escalation session |

---

## Consulting Page (`/consulting`) — Detailed Audit

### What it currently does

1. **Hero section** — "Decision enforcement for leaders under consequence"
2. **Evidence carry-forward** — Recently added, shows PA/FE evidence when available
3. **Mandate statement** — Generic institutional messaging
4. **Three engagement cards**:
   - "Diagnostics First" → `/diagnostics`
   - "Private Decision Environment" → `/contact?context=private-decision`
   - "Private Advisory" → `/contact?source=consulting&intent=consultation`
5. **Domains section** — Board strategy, Founder advisory, Frontier markets
6. **Deliverables section** — 6 generic output types
7. **Speaking section** — Speaking engagements
8. **Method section** — How the work proceeds
9. **Who this is for** — Founders, boards, leadership teams
10. **Final CTA** — "Request advisory engagement" → `/contact`

### What's wrong

1. **No access control** — Anyone can access at any time, regardless of evidence
2. **Generic CTAs** — All CTAs go to `/contact`, a generic form
3. **No evidence threshold** — A user with zero diagnostics sees the same page as a user with a full ladder
4. **No escalation trigger** — No mechanism to determine when counsel is actually necessary
5. **Brochure language** — "Advisory", "Consulting", "Private Advisory" — consultancy sales language
6. **No system handoff** — No bridge from system-detected condition to counsel engagement
7. **No retainer/counsel status** — No visibility into active coverage

---

## Contact Page (`/contact`) — Detailed Audit

### What it does

Generic contact form with dropdown options including:
- "Private / confidential advisory"
- "Strategic advisory"
- General business enquiries

### What's wrong

1. **No evidence prefill** — System-qualified users are sent to a blank form
2. **No evidence package** — The system's diagnostic data is not included with the submission
3. **No counsel workflow** — Submissions go to email, not a governed counsel case queue
4. **Generic** — Same form for sales enquiries and counsel escalation

---

## Admin Surfaces

### `/admin/counsel-review`
- Operator can assign counsel review
- Submit counsel review with trigger reason, evidence reviewed, risk if ignored
- **Good foundation** — but not connected to the user-facing counsel room

### `/admin/oversight-review`
- Operator oversight with counsel escalation
- Counsel question field for operator to ask counsel
- **Good foundation** — but not connected to user-facing intake

---

## Summary

| Surface | Classification | Action |
|---------|---------------|--------|
| `/consulting` | `BROCHURE` | Replace with governed counsel room |
| `/consulting/interventions` | `OPERATOR_ONLY` | Keep as-is |
| `/consulting/strategy-room` | `LEGACY_MARKETING` | Keep redirect |
| `/contact` | `CONTACT_FORM` | Keep for non-counsel enquiries; counsel-qualified users should not see this |
| `/admin/counsel-review` | `OPERATOR_ONLY` | Connect to counsel intake |
| `/admin/oversight-review` | `OPERATOR_ONLY` | Connect to counsel intake |
| `/private-clients` | `LEGACY_MARKETING` | Retire or redirect |
| `/strategy-room` | `SYSTEM_ESCALATION` | Keep as-is — this is the correct escalation path |
