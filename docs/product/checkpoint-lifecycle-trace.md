# Checkpoint Lifecycle Trace

**Date:** 8 May 2026  
**Purpose:** Trace a checkpoint from creation through response to downstream consumption.

---

## Lifecycle Stages

```
CREATED → DUE → OVERDUE → RESPONDED → CONSUMED
```

---

## Stage 1: CREATED

**Trigger:** User completes a diagnostic surface (Fast Diagnostic or Executive Reporting).

**Action:** `createCheckpointForCommand()` in `lib/product/checkpoint-service.ts`

**Persistence:** `prisma.diagnosticRecord.create()` with:
- `diagnosticType: "efficacy_checkpoint"`
- `status: "draft"`
- `responsesJson` containing: `commandId`, `surface`, `actionType`, `commandTitle`, `verificationQuestion`, `checkpointType`, `dueAt`, `caseId`, `journeyId`, `escalationIfIgnored`, `createdAt`

**ID linking:**
- `record.id` = the checkpoint's unique ID (returned to caller)
- `caseId` = the originating diagnostic's ID (e.g. `spine.id` for Fast Diagnostic, `run.id` for ER)
- `userEmail` = the user's email (used for retrieval)

**Example:**
```
diagnosticRecord {
  id: "ckp_abc123",
  diagnosticType: "efficacy_checkpoint",
  userEmail: "user@example.com",
  status: "draft",
  responsesJson: {
    commandId: "fast_clarify_owner_m1x2k3",
    surface: "FAST_DIAGNOSTIC",
    commandTitle: "Clarify who owns this decision",
    verificationQuestion: "Have you identified and contacted the decision owner?",
    checkpointType: "48_HOUR_ACTION",
    dueAt: "2026-05-10T12:00:00.000Z",
    caseId: "fast_abc123",
    createdAt: "2026-05-08T12:00:00.000Z"
  }
}
```

---

## Stage 2: DUE

**Condition:** `dueAt` is within the next 3 days AND `status` is `"draft"`.

**Detection:** `loadDueCheckpointsForUser()` in `lib/product/checkpoint-service.ts`:
- Queries `diagnosticType: "efficacy_checkpoint"`
- Filters by `status: { in: ["draft", "completed"] }`
- Filters by `dueAt <= now + 3 days`

**Displayed in:**
- Decision Centre: "Requires your response" section with gold border
- Shows: command title, verification question, due date, "DUE" status

---

## Stage 3: OVERDUE

**Condition:** `dueAt` is in the past AND `status` is still `"draft"`.

**Detection:** Same `loadDueCheckpointsForUser()` — computes `isOverdue` from `dueAt`.

**Displayed in:**
- Decision Centre: Red border, "OVERDUE" status
- Oversight Brief: `CHECKPOINT_OVERDUE` signal injected into oversight cycle

---

## Stage 4: RESPONDED

**Trigger:** User submits response via `CheckpointResponsePanel` (Return Brief) or challenge button (ER).

**Action:** POST to `/api/checkpoints/respond` with:
- `checkpointId`: the checkpoint's `record.id` (or sessionId for Return Brief fallback)
- `responseStatus`: COMPLETED | PARTIALLY_COMPLETED | BLOCKED | ABANDONED | NO_LONGER_RELEVANT | DISPUTED_FINDING
- Optional: `evidenceNote`, `blockerDescription`, `whatChanged`, `whatShouldSystemRemember`

**Server processing:** `pages/api/checkpoints/respond.ts`:
1. Looks up `diagnosticRecord` by ID (direct match) or by `responsesJson` contains (fallback)
2. Validates `userEmail` matches authenticated user
3. Calls `classifyCheckpointOutcome()` to map response status → outcome classification
4. Updates `status: "completed"` and appends response data to `responsesJson`

**Outcome classification mapping:**

| Response Status | Outcome Classification |
|----------------|----------------------|
| COMPLETED | ACTION_CONFIRMED |
| PARTIALLY_COMPLETED | OUTCOME_IMPROVED |
| BLOCKED | ACTION_BLOCKED |
| ABANDONED | ACTION_ABANDONED |
| NO_LONGER_RELEVANT | OUTCOME_UNCHANGED |
| DISPUTED_FINDING | SYSTEM_FINDING_DISPUTED |
| NOT_RESPONDED | INSUFFICIENT_EVIDENCE |

**Example response data:**
```json
{
  "response": {
    "status": "BLOCKED",
    "blockerDescription": "The decision owner is on leave until next month. No delegate was assigned.",
    "respondedAt": "2026-05-10T14:00:00.000Z",
    "classification": "ACTION_BLOCKED"
  }
}
```

---

## Stage 5: CONSUMED

**Where checkpoint outcomes are consumed:**

| Consumer | What it reads | How it uses it |
|----------|--------------|----------------|
| Decision Centre | `loadDueCheckpointsForUser()` | Shows response status, evidence note, date. Green border for RESPONDED. |
| Oversight Brief | `loadDueCheckpointsForUser()` | Counts OVERDUE/BLOCKED/ABANDONED → injects CHECKPOINT_OVERDUE signal |

**Not yet consuming:**
- Return Brief — has response panel but doesn't display prior checkpoint outcomes from the checkpoint system
- Strategy Room — no checkpoint integration at all

---

## Duplicate/Conflict Prevention

| Mechanism | Implementation |
|-----------|---------------|
| Single response per checkpoint | `respond.ts` updates existing record, doesn't create new one. Second POST overwrites with new response. |
| Auth gate | `resolveIdentity()` — only the owning user can respond |
| Email match | `userEmail: identity.email.toLowerCase()` in query |
| Status check | No explicit "already responded" check — second response overwrites. This is intentional (user may update their response). |

## Security

| Concern | Status |
|---------|--------|
| Checkpoint notes in sponsor-safe surfaces | ✅ Decision Centre shows evidence notes with user attribution ("user-reported blocker") |
| Raw respondent data leakage | ✅ Checkpoint payloads contain only user-submitted text |
| Admin-only content in client views | ✅ No admin-only fields in checkpoint data |
| Client-side checkpoint authority | ✅ All mutations go through authenticated server route |
| localStorage/sessionStorage authority | ✅ No checkpoint state stored client-side |
