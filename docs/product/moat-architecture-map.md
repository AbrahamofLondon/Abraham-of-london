# Moat Architecture Map

**Date:** 9 May 2026
**Purpose:** Five-layer map of the product's moat architecture, showing dependencies and gaps.

---

## Layer 1 — Visible Product

```
Diagnostics (Fast, PA, Constitutional, Team, Enterprise)
  → Executive Reporting
    → Boardroom Mode
  → Strategy Room (Entry + Session)
    → Return Brief
  → Decision Centre
  → Oversight Brief
  → Counsel Room
```

**What competitors see:** The UI. The result pages. The diagnostic formats.
**What they can copy:** Surface-level structure and language.
**What they cannot copy:** The data flowing through these surfaces.

**Gaps:** Executive Reporting result page is overdense (18 blocks). Boardroom Mode has no standalone page.

---

## Layer 2 — Behavioural Enforcement

```
Commands (buildXCommand)
  → Checkpoints (create, due, overdue, responded)
    → Responses (COMPLETED, BLOCKED, ABANDONED, DISPUTED)
      → Decision Centre display
      → Return Brief confrontation
      → Oversight Brief signals
```

**What competitors see:** Checkpoint notifications, response options.
**What they can copy:** The concept of checkpoints.
**What they cannot copy:** The 7-surface integration, the response classification system, the overdue detection.

**Gaps:** No email delivery. No push notifications. No calendar integration.

---

## Layer 3 — Memory

```
Evidence Spine (80 fields, 8 stages)
  → Case Memory (governed memory items)
  → PA Memory (competing obligation, consequence, pattern)
  → FE Snapshots (estimated exposure, band, basis)
  → Checkpoint History (response status, evidence notes)
  → Counsel Cases (intake, evidence package, status)
  → Boardroom Archive (dossiers, qualification history)
```

**What competitors see:** "Evidence carried forward" labels, source-attributed memory items.
**What they can copy:** The concept of memory.
**What they cannot copy:** The accumulated data — 80 fields per user, checkpoint responses, counsel cases.

**Gaps:** No data export. No "what you would lose" communication. No institutional memory page.

---

## Layer 4 — Intelligence

```
Contradiction Graph (temporal, cross-assessment, decay-aware)
  → Cross-Assessment Interference Detection
  → Pattern Recurrence (cross-case text matching)
  → Irreversibility Index (multi-factor)
  → Decision Velocity (time from diagnosis to action)
  → What Changed (before/after comparison)
  → Kernel Accuracy (self-auditing, bias correction)
```

**What competitors see:** Nothing — this layer is almost entirely hidden.
**What they can copy:** Nothing — the data is accumulated per-user.
**What they cannot copy:** The contradiction graph with user-specific temporal data, the kernel's prediction/outcome pairs.

**Gaps:** Almost nothing in this layer is surfaced. The contradiction graph, kernel accuracy, cross-assessment intelligence, and decision velocity are computed but invisible.

---

## Layer 5 — Strategic Dependency

```
Retainer Oversight (cadence, cycle history, renewal)
  → Counsel Escalation (evidence package, operator workflow)
  → Boardroom Dossiers (generation, archive, delivery)
  → Operator Review (counsel cases, oversight cycles)
  → Outcome Verification (diagnose → act → verify → learn)
  → Proof Pack (downloadable evidence summary)
  → Institutional Memory Export (data portability with switching cost)
```

**What competitors see:** Retainer status, counsel intake form, boardroom dossier.
**What they can copy:** The concepts.
**What they cannot copy:** The accumulated cycle history, the counsel case records, the boardroom archive.

**Gaps:** Outcome verification loop is not built. Proof pack does not exist. Institutional memory page does not exist. Counsel case status tracking is not built.

---

## Layer Dependency Map

```
Layer 5 depends on Layer 4 for intelligence inputs
Layer 4 depends on Layer 3 for accumulated memory
Layer 3 depends on Layer 2 for behavioural enforcement data
Layer 2 depends on Layer 1 for user interaction
Layer 1 depends on nothing — it's the entry point
```

**Where the product breaks:**
- Layer 3→4: Intelligence exists but is not surfaced (contradiction graph, kernel accuracy, cross-assessment)
- Layer 4→5: Strategic dependency surfaces exist but are weakly connected (boardroom delivery, outcome verification)
- Layer 2→3: Checkpoint data flows to memory but is not used for intelligence (no decision velocity computation yet)

---

## Moat Strength by Layer

| Layer | Current Strength | Target Strength | Gap |
|-------|-----------------|-----------------|-----|
| 1 — Visible Product | MODERATE | STRONG | Executive Reporting density, Boardroom delivery |
| 2 — Behavioural Enforcement | STRONG | VERY STRONG | Email delivery, push notifications |
| 3 — Memory | VERY STRONG | ACQUISITION-LEVEL | Data export, institutional memory page |
| 4 — Intelligence | STRONG (hidden) | VERY STRONG (surfaced) | Surface contradiction map, velocity, what changed |
| 5 — Strategic Dependency | MODERATE | VERY STRONG | Outcome verification, proof pack, counsel status |
