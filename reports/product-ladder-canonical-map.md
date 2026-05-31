# Product Ladder — Canonical Map
**Phase 0 — Stop Fragmentation**
Generated: 2026-05-31

## The One Ladder

Every commercial output maps to a single tier. No orphan diagnostics.
No instrument packs. No discount bundles. No consumer e-commerce.

```
Tier                  Price          Delivery
────────────────────────────────────────────────────────────────────
FREE_SIGNAL           £0             Instant / public aperture
BASIC_BRIEF           £49–£95        Async / 24–48 hr
FULL_DOSSIER          £295–£495      Async / 48–72 hr (human-reviewed)
URGENT_OPERATIONAL    £750–£1,250    Prioritised / 24 hr
EXECUTIVE_BOARD       from £2,500    Full governed review / founder
RETAINED_CONTINUITY   monthly/qtrly  Ongoing case management
STRATEGY_ROOM         case-attached  Live session on existing case only
```

---

## Tier Specifications

### FREE_SIGNAL
Shown to: all public visitors, no account required

Must include:
- Situation class (decision classification)
- What the system saw (non-generic, case-specific)
- Primary failure point
- Governing tension
- Consequence class
- Direction of minimum viable move

Must NOT include:
- Full evidence graph
- Full actor map
- Full adversarial challenge
- Fallback path detail
- Verification reference
- Complete option comparison

Quality rule: "What the system saw" must not apply to ten different situations.

---

### BASIC_BRIEF
Shown to: paid buyer after £49–£95

Must include:
- Short failure map (2–3 primary failure points)
- Primary and secondary failure point
- Minimum viable move
- Short fallback if ideal path unavailable
- What not to do (forbidden actions)

---

### FULL_DOSSIER
Shown to: paid buyer after £295–£495, after human review pass

Must include:
- Authority map
- Obligation map
- Constraint graph
- Evidence graph (verified / assumed / absent / stale)
- Adversarial challenge
- Self-adversarial challenge
- Minimum viable path (ordered moves)
- Forbidden actions
- Fallback path
- What must not be delayed
- Regulated boundary output / professional brief where triggered
- Record reference (verification token)

Must NOT be delivered without:
- Self-adversarial challenge present
- Human review assessment logged
- Regulated boundary check completed
- Quality standard passed

---

### URGENT_OPERATIONAL
Adds to FULL_DOSSIER:
- 24–48 hour triage sequence
- Priority ordering
- Escalation triggers
- Human-reviewed execution order

---

### EXECUTIVE_BOARD
Adds to FULL_DOSSIER:
- Board-ready summary (1 page)
- Actor and authority map with named parties
- Options comparison (minimum 3 options)
- Adversarial review of each option
- Decision conditions (what must be true before committing)
- Founder review sign-off

---

### RETAINED_CONTINUITY
Adds:
- Case drift tracking (monthly)
- Outcome follow-up
- Assumption re-testing
- Recurring review cadence
- Strategy Room access attached to active case

---

### STRATEGY_ROOM
Only available when: active Living Decision Case exists
Never: standalone intake / starting from scratch

Must:
- Continue the case, not restart it
- Show pre-session brief
- Record all amendments as append-only events
- Update minimum viable path
- Update adversarial challenge
- Set next trigger

---

## Commercial Rules

1. Payment unlocks entitlement on an existing case — buyer never starts again after paying
2. No discount bundles
3. No "instrument packs"
4. The buyer pays for: access depth, review level, record durability, continuity
5. No full dossier without self-adversarial challenge
6. No executive output without human/founder review
7. No regulated advice overclaim

---

## Routes That Must Not Exist Until Kernel Is Live

- Any new public surface
- Any new checkout path
- Any orphan diagnostic route
- Any route that looks premium but produces generic output

---

## Current Route Status

| Route | Current State | Target State |
|-------|--------------|--------------|
| `/foundry/decision-test` | Standalone DFM aperture | FREE_SIGNAL aperture on Living Case |
| `/foundry/market-signal-test` | Standalone market analyser | Market claim lens aperture |
| `/foundry/release-risk-test` | Standalone release analyser | Release risk lens aperture |
| `/foundry/start` | Generic start page | Case creation intake |
| `/foundry/value` | Value page | BASIC_BRIEF/FULL_DOSSIER landing |
| `/verify` | Honest token check | Case verification reference |
| `/continuity` | Doctrine page | Continuity tier entry |
