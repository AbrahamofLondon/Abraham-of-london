# EDOS Memory Governance Charter

**Version:** 1.0  
**Effective Date:** 2026-06-14  
**Status:** Active  

---

## What This Charter Is

This is a plain-language explanation of how EDOS remembers information, what you own, what you can do with your data, and what remains proprietary to the system.

**If you're a client considering EDOS, this charter explains your data rights and switching costs clearly.**

---

## What EDOS Remembers

EDOS remembers six types of information:

### 1. **Raw Client Evidence** (You Own This)
These are facts about your organization:
- Decisions you tell us about
- Timeline of events
- External evidence you provide
- Direct observations from your systems

**You own this data completely.** You can:
- ✅ View it anytime
- ✅ Correct it if it's wrong
- ✅ Export it if you leave
- ✅ Request deletion (if not required for auditing)

### 2. **User-Provided Memory Events** (You Own This)
These are observations you add to specific cases:
- "We discovered the issue on Tuesday"
- "Procurement rejected the vendor"
- "The executive approved the framework"

**You own this data completely.** Same rights as raw client evidence.

### 3. **System-Derived Contradiction Topology** (EDOS Owns This)
These are connections the system discovers:
- Which decisions contradict other decisions
- How often patterns recur in your data
- Weighted relationships between risk factors
- How evidence from one case relates to another

**You cannot export this.** It only exists because EDOS learned over time and connected your memories. Another system wouldn't know these connections. This is EDOS-proprietary intelligence.

### 4. **System Calibration Weights** (EDOS Owns This)
These are adjustments EDOS made based on experience:
- How much to trust certain warning types
- How falsification history changes predictions
- Recurrence scoring adjustments
- Confidence bounds based on evidence quality

**You cannot export this.** These weights are specific to EDOS's learning process and internal decision logic.

### 5. **Aggregate Anonymised Patterns** (EDOS Owns This)
These are patterns the system sees across all clients:
- "This type of contradiction recurs in 60% of cases across your industry"
- Generic risk frameworks and precedents
- Statistical patterns from anonymised data

**You cannot export this.** It's learned from cross-client data and is proprietary to EDOS.

### 6. **Immutable Audit Logs** (EDOS Keeps These)
These are permanent records of system decisions:
- When falsification was recorded
- When consequence verification happened
- When decision debt was priced
- Original evidence that the system verified itself against

**You cannot delete these.** They're permanent because EDOS needs them to prove it was right or wrong. You can view them; you cannot erase them.

---

## Your Data Rights

### Viewing Your Data
- ✅ You can view all raw client evidence and user-provided memory anytime
- ✅ You can view audit logs anytime
- ✅ You cannot view system-derived topology or calibration weights (those are internal)

### Correcting Your Data
- ✅ You can request correction of raw evidence ("That date was wrong")
- ✅ The system records the correction as a new event (does not rewrite history)
- ✅ Original record stays, but correction is visible
- ✅ The system may recalibrate recommendations if the correction is significant

### Exporting Your Data
- ✅ You can export all raw client evidence
- ✅ You can export all user-provided memory events
- ✅ The export includes a human-readable summary of what you get
- ✅ The export lists what you DON'T get (derived topology, calibration, aggregate patterns) and why
- ❌ You cannot export system-derived topology
- ❌ You cannot export system calibration weights
- ❌ You cannot export aggregate pattern library

### Deleting Your Data
- ✅ You can request deletion of raw client evidence (unless it's needed for auditing)
- ✅ You can request deletion of user-provided memory events (unless it's needed for auditing)
- ❌ You cannot delete audit-locked records that support verification, falsification, or consequence checks
- ❌ You cannot delete records required to prove the system made good predictions or bad ones

---

## What Happens When You Leave

### You Get
- ✅ All your raw client evidence in portable format
- ✅ All your user-provided memory events
- ✅ A summary of EDOS's findings about your decisions
- ✅ Lists of what was predicted right and what was predicted wrong
- ✅ Historical audit logs showing how EDOS verified itself

### You Lose
- ❌ System-derived contradiction topology (unique to EDOS)
- ❌ Calibration state (specific to EDOS's learning)
- ❌ Accumulated recurrence weighting (would need to rebuild)
- ❌ Aggregate pattern intelligence (cross-client learning)
- ❌ Strategic Twin continuity (system state unique to EDOS)
- ❌ Falsification-aware confidence adjustment (specific calibration)

**This is lawful and measured:** You're getting your raw data. You're not getting EDOS's proprietary learned intelligence. Another system cannot be told "use EDOS's calibration" because that intelligence is specific to EDOS's design.

### How to Reduce Switching Cost
- Keep running EDOS while using another system in parallel (not a hard rule, just practical)
- Export your data regularly so you have backups
- Document your own findings separately (don't rely only on EDOS)
- Note EDOS's falsification history yourself (so you know what it got wrong)

---

## Memory Governance in Practice

### Correction Example
```
Original: "Board meeting on June 1 approved the framework"
Later: "Actually, it was June 3, not June 1"

Result:
- Original record marked corrected
- Correction record added with timestamp
- EDOS recalibrates timeline-dependent predictions
- Both records visible in audit trail
```

### Erasure Example
```
You request: Delete memory events from Project X (canceled project)

EDOS checks:
✓ Events not linked to ongoing falsification record → DELETE
✓ Events not linked to pending consequence verification → DELETE
✓ Events not linked to audit-locked decision debt → DELETE
✗ Event linked to falsification (need to prove the warning was wrong) → KEEP
✗ Event linked to verification due in 30 days → KEEP

Result: 12 records deleted, 2 records retained (with reasons explained)
```

### Export Example
```
You request: Export my data to another system

Export includes:
✓ 847 raw client evidence records (all of it)
✓ 234 user-provided memory events (all of it)
✓ Summary: "EDOS found 12 recurring contradictions, predicted 8 correctly, 3 falsified"
✓ List of excluded categories with explanations

Excluded from export:
✗ Contradiction topology weights (proprietary)
✗ Recurrence scoring algorithm (proprietary)
✗ Calibration adjustments (proprietary)
✗ Cross-client pattern library (proprietary)
```

### Decay Example
```
EDOS memory maintenance runs monthly:

Candidates for archiving: 50 low-severity stale events
Check audit-lock status:
✓ Not linked to verification/falsification/debt → CAN ARCHIVE
✓ Not linked to verification/falsification/debt → CAN ARCHIVE
✗ Linked to decision-debt record (need to explain debt basis) → SKIP
✗ Linked to falsification event (need to prove warning was wrong) → SKIP
✗ Linked to pending consequence verification (need source for outcome check) → SKIP

Result: 45 records archived, 5 records retained (continue paying storage cost)
```

---

## Authority and Governance

**EDOS memory governance does NOT grant authority.**

- Memory changes (correction, export, deletion) do not change who has authority
- EDOS recommendations are still advice, not orders
- Governance changes do not bypass governance gates
- Positive authority remains 0 (unchanged by all memory operations)

---

## If You Discover a Problem

### Correction Request
- Describe what's wrong: "This memory event has the wrong date"
- Request: "Correct this to: [new information]"
- EDOS records the correction, appends it to your history, may recalibrate

### Erasure Request
- Describe what should be deleted: "All Project X memory"
- Legal basis (if applicable): "Legal hold released", "GDPR data subject request", etc.
- EDOS processes, lists what was deleted and what was retained

### Export Request
- EDOS prepares a portable export of your raw data
- You get explanation of what wasn't included (and why)
- You can move your raw data to another system
- (Derived intelligence stays with EDOS)

### Appeal
- If EDOS retains records you think should be deleted, you can appeal
- EDOS explains the legal/audit basis for retention
- Independent review available if you contest the decision

---

## Legal Foundation

**Your data rights are grounded in:**
- Data portability rights (GDPR, CCPA, etc.)
- Right to correct inaccurate information
- Right to access your own records
- Right to delete records (subject to legal retention requirements)

**EDOS's property rights are grounded in:**
- Trade secret law (proprietary topology, calibration, aggregate patterns)
- Contract law (you agree EDOS-derived intelligence is proprietary)
- No industry standard exists for exporting system-specific learned intelligence

---

## Switching Cost: Honest Language

### What You Should Know
- **You can take your raw data.** All of it. That's 80-90% of what EDOS uses to think.
- **You cannot take EDOS's learned intelligence.** The remaining 10-20% (topology, calibration, aggregate patterns) exists only because EDOS built it. Another system starts from scratch.
- **This is not lock-in.** You can leave. It's a measured cost, not impossible.
- **This is normal.** AWS can't give you their ML models. Salesforce can't give you their Einstein predictions. EDOS operates the same way.

### What You Can Do to Minimize Switching Cost
- Export your data quarterly (keep backups)
- Document EDOS's findings yourself
- Run EDOS and a competitor in parallel (during eval phase)
- Ask EDOS for historical accuracy statistics (how often it was right/wrong)
- Use your own independent analysis alongside EDOS (don't rely solely on it)

---

## Summary

| Data Type | You Own | Can Export | Can Delete | EDOS Owns | Can't Export |
|-----------|:-------:|:-----------:|:-----------:|:---------:|:-------------:|
| Raw client evidence | ✅ | ✅ | ✅ | — | — |
| User-provided memory | ✅ | ✅ | ✅ | — | — |
| Contradiction topology | — | — | — | ✅ | ✅ |
| Calibration weights | — | — | — | ✅ | ✅ |
| Aggregate patterns | — | — | — | ✅ | ✅ |
| Audit logs | ✅ (view) | ✅ (view) | ❌ | ✅ (immutable) | ✅ |

---

## Charter Acceptance

By using EDOS, you accept:
- [x] This charter accurately describes your data rights
- [x] You own raw evidence and can export/correct/delete it
- [x] EDOS-derived intelligence is proprietary
- [x] Switching cost is the loss of derived intelligence, not your data
- [x] Authority governance is separate from memory governance
- [x] Positive authority remains 0 regardless of governance changes

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-14 | Initial charter (Phase 5) |

---

## Questions?

This charter is public and permanent. Questions about your data rights:
- **Export request:** Contact support
- **Correction request:** File via memory governance UI
- **Deletion request:** File via memory governance UI with legal basis
- **Legal review:** escalations@edos-system.internal

---

**EDOS Memory Governance Charter — Effective 2026-06-14**
