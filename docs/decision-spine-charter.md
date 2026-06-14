# EDOS Decision Spine Charter

**Version:** 1.0  
**Effective Date:** 2026-06-14  
**Status:** Phase 6 (Pre-Connector, Evidence Foundation)  

---

## What This Charter Is

This is a plain-language explanation of how EDOS ingests external evidence without creating surveillance risk, privacy violation, or authority escalation.

**EDOS does not monitor people. EDOS governs decision evidence.**

---

## What EDOS Ingests

EDOS can ingest external evidence from these sources (with consent and approval):

### Approved Source Types

| Source Type | Trust Tier | Consent Required | Notes |
|---|---|:---:|---|
| **board_minutes** | Authoritative | Org-level | Signed, dated meeting records |
| **meeting_notes** | Operational | Org-level | Internal documented meetings |
| **email_thread** | Operational | Org-level | Decision-relevant emails only |
| **calendar_event** | Operational | Org-level | With redaction of personal time |
| **jira_ticket** | Operational | Org-level | Project management records |
| **crm_record** | Operational | Org-level | Customer/business records |
| **document_revision** | Authoritative (if signed) | Org-level | Signed/dated documents |
| **manual_upload** | Requires review | Explicit | Requires source provenance |
| **system_generated_record** | Requires source link | Org-level | With linked original evidence |
| **slack_thread** | Informal | Org-level | Requires corroboration for decisions |

---

## What EDOS Extracts

When EDOS ingests evidence, it looks for:

### Extracted Decision Elements

- **Commitments:** "We will deliver X by Y date"
- **Contradictions:** "We committed to X but also committed to Y (conflicting)"
- **Mandate Changes:** "Authority changed. New approach approved."
- **Missing Evidence:** "We need Z to verify decision"

### What EDOS Does NOT Extract

- Personal details (names, addresses, health, financial info)
- Incidental metadata (exact timestamps, location, device info)
- Sentiment or tone (only facts matter)
- Speculation or opinion (only documented decisions)
- Anything outside decision/execution scope

---

## What EDOS Ignores

EDOS will **not ingest or store** any of these:

### Absolutely Blocked Content

| Category | Examples | Why Blocked |
|---|---|---|
| **Personal data** | Names, addresses, phone, SSN, IDs | Privacy protection |
| **Health/medical** | Medical records, health discussions | HIPAA / privacy law |
| **Legal proceedings** | Litigation, legal advice, privileged communications | Legal privilege |
| **HR/employment** | Compensation, discipline, performance reviews | Employment privacy |
| **Financial personal** | Personal bank, tax, investment info | Financial privacy |
| **Surveillance data** | Monitoring, keystroke logs, location tracking | Anti-surveillance |
| **System credentials** | Passwords, API keys, tokens | Security |

### Quarantine Before Promotion

- Ambiguous classifications (human review required)
- Single-source informal claims (need corroboration)
- AI-generated content (need linked source evidence)
- Redacted material (verify redaction succeeded)
- Undocumented claims (need provenance/source ID)

---

## How Evidence Becomes Memory

### Step 1: Ingestion (Consent-Bound)
```
External source → Request consent → Org approves → Ingest with consent record
```

### Step 2: Classification (Privacy-Protected)
```
Raw content → Classify trust tier → Identify redaction needs → Apply redaction
```

### Step 3: Decision Relevance Check
```
Content → Extract commitments/contradictions → Is it decision-relevant? 
→ If no extraction, do not promote
```

### Step 4: Personal/Protected Check (Fail-Closed)
```
Content → Is it personal/HR/legal/medical? → Yes → Quarantine, flag for review
         → No → Continue
```

### Step 5: Redaction (Safety-Verified)
```
Does content need redaction? → Yes → Apply redaction → Did it succeed?
         → Fail → Reject storage
         → No → Continue
```

### Step 6: Human Review (Ambiguous Cases)
```
Is classification certain? → No → Quarantine, require human approval
         → Yes → Continue
```

### Step 7: Promotion to Memory (Governed)
```
All checks pass → Create governed memory event → Audit-lock ingestion record
```

### Step 8: Decision Relevance Integration
```
Extract commitments → Link to decision debt? (only if corroborated)
Extract contradictions → Link to falsification review? (only if authoritative)
```

---

## Decision Debt Rules for Ingestion

### What Can Create Decision Debt

```
Authoritative source (board_minutes, signed document)
  + Extracted commitment
  + Corroboration needed? Yes → verify from 2+ sources
  = Can create/inform decision debt
```

### What Cannot Create Debt Alone

```
Informal signal (Slack, email)
  + Extracted commitment
  - No corroboration
  = Cannot create debt. Can inform investigation.

AI-generated claim
  + No linked source evidence
  = Cannot become authoritative. Flagged as "requires source link"
```

---

## Privacy Safeguards

### What EDOS Will NOT Do

- ❌ **Monitor** employees, users, or individuals
- ❌ **Track** who said what in real-time
- ❌ **Retain** personal data longer than needed
- ❌ **Share** personal data with third parties without consent
- ❌ **Create** dossiers on people
- ❌ **Infer** personal characteristics from decision records

### What EDOS Will Do

- ✅ **Ingest** decision-relevant evidence with consent
- ✅ **Redact** personal/private material before storage
- ✅ **Quarantine** ambiguous or protected-category material
- ✅ **Audit-log** all ingestion decisions
- ✅ **Fail-close** when classification is uncertain
- ✅ **Allow export** of ingestion records (as memory records)

---

## Quarantine: How EDOS Handles Uncertainty

### Automatic Quarantine (No Human Action Needed)

Evidence is quarantined if:
- Classification is ambiguous (uncertain if personal/decision)
- Source trust is insufficient (informal, unverified)
- Redaction failed (cannot safely extract decision content)
- Provenance is missing (source identity unclear)
- Protected category is suspected (legal, HR, medical, financial personal)

### Result of Quarantine

- Not stored in governed memory
- Not promoted to decision debt
- Preserved separately until human review
- Can be manually approved if safe
- Can be permanently deleted
- Quarantine decision is audit-logged

---

## Authority & Autonomy

### What Ingestion Cannot Do

- ❌ Grant positive authority (remains 0)
- ❌ Trigger autonomous decisions
- ❌ Create compliance without human gate
- ❌ Bypass governance rules
- ❌ Override approval requirements

### What Happens With Contradictions

```
Evidence shows: "We committed to X"
Evidence shows: "We committed to opposite of X"

Result: Contradiction extracted and flagged
Human review: Is this a real contradiction or miscommunication?
Action: None automatic. Flagged for decision inbox.
```

---

## Example: Email Ingestion

### Scenario
```
Email from CEO to Board: "We're shipping the dashboard in June"
```

### EDOS Processing

**Ingestion:** 
- Source: email_thread
- Trust: single_source_operational_record
- Consent: Org-level (CEO email approved for ingestion)
- Redaction: Remove recipient names, phone numbers, signatures

**Extraction:**
- Commitment: "Dashboard shipped June"
- Deadline: "June 2025"
- Actor: "CEO" (redacted, not specific person)

**Promotion Check:**
- Decision-relevant? Yes (shipping commitment)
- Personal material? No (redacted names)
- Corroboration needed? Yes (single email, might need confirmation)

**Result:**
- Added to memory as "email signal"
- Marked "requires corroboration before debt creation"
- If contradicted by later board meeting, triggers falsification review

---

## Example: Slack Message Ingestion

### Scenario
```
Slack: "@alice This feature got blocked again"
```

### EDOS Processing

**Ingestion:**
- Source: slack_thread
- Trust: informal_signal
- Consent: Org-level (Slack workspace approved)
- Redaction: Remove @names, timestamps, emoji

**Classification:**
- Decision-relevant? Unclear (vague, single message)
- Personal? Could be (mentions specific person)
- Protected? No

**Quarantine Decision:**
- "Informal_signal without context"
- "No clear commitment extracted"
- "Requires human review for context"

**Result:**
- Quarantined (not promoted to memory)
- Preserved for human inspection
- Human can mark as "clarified" or "delete"
- If human adds context ("blocked by X, deadline was Y"), then promoted

---

## What You Can Do

### As a Governed Organization

You can:
- ✅ Approve/deny source connections
- ✅ Set ingestion consent policy
- ✅ Request quarantine review
- ✅ Export ingestion records (as memory data)
- ✅ Correct extracted commitments
- ✅ Delete eligible ingestion records

You cannot:
- ❌ Force ingestion of personal data
- ❌ Bypass redaction requirements
- ❌ Store surveillance data
- ❌ Skip human review for protected categories
- ❌ Export AI extraction results without source evidence

---

## Real Safeguards in Place

| Safeguard | How It Works |
|-----------|-------------|
| **Consent-bound** | No source ingestion without org approval |
| **Privacy-protected** | Personal material redacted before storage |
| **Fail-closed** | Uncertain classifications quarantined |
| **Audit-locked** | All ingestion decisions immutable |
| **Authority-separate** | Ingestion cannot grant authority |
| **Human-gated** | Protected categories require explicit review |
| **Source-verified** | Provenance required for promotion |
| **Topology-safe** | Ingestion does not export proprietary topology |

---

## Before We Connect to Your Systems

Before EDOS connects to live Slack, Jira, Gmail, or Calendar:

1. **Your team reviews this charter** and approves ingestion policy
2. **You name sources to ingest** (exact channels, projects, document types)
3. **You set redaction rules** (what categories to protect)
4. **You name who approves quarantine review** (decision owner)
5. **EDOS demonstrates consent workflow** (you can disable anytime)
6. **You test with non-sensitive data first** (sandbox run)
7. **Legal review** (if required by your org)
8. **You approve live ingestion** with written authorization

---

## Questions?

This charter is public and permanent.

**Questions about ingestion:**
- "What counts as personal data?" → See blocked categories above
- "Can EDOS ingest our Slack?" → Yes, with org consent and redaction
- "Will EDOS store chat messages?" → Only decision-relevant; personal names redacted
- "Can I delete ingestion records?" → Yes, eligible records deletable; locked records retained
- "Who reviews quarantine?" → Your named decision owner
- "What if I don't approve a source?" → EDOS doesn't ingest it

**Questions about privacy:**
- "Is EDOS monitoring us?" → No. EDOS ingests external evidence you approve.
- "Can EDOS see my personal emails?" → No. Redaction removes personal content.
- "Will EDOS share data externally?" → No. Proprietary topology not exported.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-14 | Initial charter (Phase 6, pre-connector) |

---

**EDOS Decision Spine Charter — Phase 6 Foundation (Pre-Connector)**
