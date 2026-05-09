# Efficacy Spine — Defect Register

**Date:** 8 May 2026  
**Status:** 2 critical defects fixed, 3 remaining (low/medium)

---

## Fixed Defects

### D1 — Executive Reporting challenge uses hardcoded checkpoint ID

**Severity:** CRITICAL  
**Status:** FIXED  

**Problem:** The "Challenge with evidence" button in the Executive Reporting result page used a hardcoded `checkpointId: "er_challenge"` instead of the real checkpoint ID returned by the API. The `/api/checkpoints/respond` endpoint would return 404 because no `diagnosticRecord` with that ID exists. The user's challenge response was silently lost.

**Fix applied:**
1. Added `checkpointId?: string | null` to the `ExecutiveReportingResult` type (`pages/diagnostics/executive-reporting/run.tsx`)
2. Changed the challenge button to use `result.checkpointId` instead of `"er_challenge"`
3. Added a guard: if `checkpointId` is null, shows an alert instead of silently failing

**Files changed:**
- `pages/diagnostics/executive-reporting/run.tsx` — type definition + button handler

---

### D2 — Return Brief checkpoint response uses wrong ID

**Severity:** CRITICAL  
**Status:** FIXED  

**Problem:** The Return Brief's `CheckpointResponsePanel` used `sessionId` (a strategy room session key like `sr_...`) as the `checkpointId`. But checkpoints are created with `caseId` (a Fast Diagnostic spine ID like `fast_...` or an ER run ID). The IDs never match, so the response would always return 404.

**Fix applied:**
Added a fallback lookup in the respond endpoint: if direct ID lookup fails, search for a checkpoint where `responsesJson` contains the provided ID string (matching against `caseId`, `journeyId`, or `sessionId` stored in the checkpoint payload).

**Files changed:**
- `pages/api/checkpoints/respond.ts` — added fallback `responsesJson` contains lookup

---

## Open Defects

### D3 — Strategy Room surfaces don't create checkpoints

**Severity:** MEDIUM  
**Status:** OPEN — P1 work  

**Problem:** `buildStrategyRoomCommand()` exists in the efficacy contract but is never called from any Strategy Room surface. The "Next required action" in the session page is dynamic local state, not a persisted checkpoint. No checkpoint is created when entering or using the Strategy Room.

**Impact:** Strategy Room decisions are not tracked by the checkpoint system. Users cannot respond to Strategy Room checkpoints from Decision Centre. Oversight Brief cannot detect overdue Strategy Room actions.

**Files involved:**
- `pages/strategy-room/index.tsx` — should call `buildStrategyRoomCommand()` + `createCheckpointForCommand()` on entry
- `pages/strategy-room/session/[id].tsx` — should call `buildStrategyRoomCommand()` on state change

---

### D4 — Decision Centre heading misleading for responded checkpoints

**Severity:** LOW  
**Status:** OPEN  

**Problem:** The Decision Centre checkpoint section is headed "Requires your response" but also shows already-responded checkpoints. This is confusing for items the user has already completed.

**Suggested fix:** Split into two sections: "Requires response" (DUE/OVERDUE) and "Recent responses" (RESPONDED).

---

### D5 — Oversight Brief checkpoint signal uses `as any` cast

**Severity:** LOW  
**Status:** OPEN  

**Problem:** The `CHECKPOINT_OVERDUE` signal type is pushed with `as any` cast because it's not in the canonical signal type union.

**Suggested fix:** Add `CHECKPOINT_OVERDUE` to the signal type definition in the oversight signal contract.

---

## Defect Summary

| ID | Severity | Surface | Status | Fix |
|----|----------|---------|--------|-----|
| D1 | CRITICAL | Executive Reporting | ✅ FIXED | Use real checkpointId from API response |
| D2 | CRITICAL | Return Brief | ✅ FIXED | Add fallback lookup in respond endpoint |
| D3 | MEDIUM | Strategy Room | OPEN | Wire buildStrategyRoomCommand() into surfaces |
| D4 | LOW | Decision Centre | OPEN | Split checkpoint section heading |
| D5 | LOW | Oversight Brief | OPEN | Add CHECKPOINT_OVERDUE to signal type |
