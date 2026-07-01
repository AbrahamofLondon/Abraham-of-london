# Tier 1 Closeout — The Fiction Adaptation

**Date:** June 29, 2026
**Package status:** Production-ready for owner review and **manual** submission.
**This `tier-1/` directory is the SOLE production source of truth** for Tier 1 submissions.

> **No queries have been sent.**
> **The owner must verify each agency's guidelines on the day of submission.**
> **The owner sends every query manually.**

---

## Tier 1 export package status

- Six agents: each has a **planning folder** (`NN-agent/`, 6 files) and an **export folder** (`exports/NN-agent/`).
- Sendable export folders contain paste-ready sources **and** clean DOCX.
- Held/alternate export folders are **complete but blocked** (paste-ready sources, no premature DOCX; the metadata-scrub report states why).
- Authoritative infra in this directory: `ai-policy-review.md`, `submission-tracker.md`, `EXPORT-READINESS-SUMMARY.md`, `TIER-1-README.md`, this closeout.

## Agents

**Sendable (after day-of guideline check + manual approval):**
- Olivia Maidment — Madeleine Milburn
- Sam Farkas — Jill Grinberg Literary Management (US)

**Disclosure-ready (AI disclosure included; verify agency stance day-of, apply practical rule):**
- Judith Murray — Greene & Heaton (primary G&H)
- Jemima Forrester — David Higham Associates (primary DH, one-agent rule)

**Alternate — same-agency backup (do not send while the primary is active):**
- Imogen Morrell — Greene & Heaton (backup to Judith Murray)
- Nicola Chang — David Higham Associates (backup to Jemima Forrester)

## AI-policy — RESOLVED
- Decision made (see `ai-policy-review.md`): **disclose truthfully.** A single approved line is included in the four flagged-agency queries (Greene & Heaton: Judith, Imogen; David Higham: Jemima, Nicola), placed after the author bio. Madeleine Milburn and Jill Grinberg have no stated policy — **no disclosure in their queries**; tell the truth only if asked.
- Remaining step for the flagged agencies is **not a decision** but a **day-of verification**: confirm each agency's current stance and apply the practical rule — send if it requires/permits disclosure; do not submit if it prohibits AI-assisted work without clarification; ask/hold if ambiguous.

## Same-agency blockers
- **Greene & Heaton:** Judith primary; Imogen only after Judith passes / window expires.
- **David Higham:** Jemima primary; **one-agent-only rule** — Nicola only after Jemima passes / window expires.

## DOCX verification status
- Sendable agents each have: Query, 1-page synopsis, 3-page synopsis, first-50-pages.
- All verified via python-docx: open cleanly; author = "Abraham of London"; **no comments, no tracked changes, no hidden text**.

## 50-page sample verification
- `first-50-pages.docx` = Chapters 1–5 complete + the opening of Chapter 6, ending at a clean paragraph break.
- **Confirmed at exactly 50 pages** in LibreOffice (12pt Times New Roman, double-spaced, 1" margins).

## Lock-file hygiene added
- Package-local `private/submission-packages/the-fiction-adaptation/.gitignore` ignores `.~lock.*#` so LibreOffice lock files can't be force-added with the export DOCX.
- Repo-root `.gitignore` was **not** touched.
- No lock files are tracked.
- **Tip for the owner:** when re-exporting, prefer `git add -f tier-1/exports/**/*.docx tier-1/exports/**/*.md` over `git add -f tier-1/exports/` so a lock file from an open document is never swept in.

## Superseded / stale files — DELETED

All superseded flat Tier 1 query-package files have been deleted.
The stale submission-level `the-fiction-adaptation-query-letter-final.md` has been deleted.
The duplicated submission-level AI-policy, tracker, and pre-send checklist files have been deleted.
The `tier-1/` directory is the sole production source of truth for Tier 1 execution.
No query has been sent. Owner must verify guidelines day-of. Owner sends manually.

**Deleted:**
- `submission/tier-1/01..06-*-query-package.md` — six pre-rebuild flat query packages (no external references).
- `submission/the-fiction-adaptation-query-letter-final.md` — STALE (Mexican Gothic + placeholders).
- `submission/the-fiction-adaptation-query-letter-draft.md` — pre-rebuild query file that still held an author-bio `[PLACEHOLDER]` and a stale Mexican Gothic note; an apparent send source, now redundant. (One file beyond the correction brief's explicit list, removed to satisfy its standard that no stale query file remain as an apparent send source.)
- `submission/ai-policy-review.md`, `submission/submission-tracker.md`, `submission/pre-send-owner-checklist.md` — duplicates of the authoritative `tier-1/` versions.

**Still canonical in `submission/` (retained):** one-page synopsis, three-page synopsis, pitch-positioning, submission-package-report, agent-targeting-list, agent-targeting-report, agent-submission-strategy, comp-research-and-query-finalization, SUBMISSION_JOURNEY. The corrected, send-ready query lives self-contained in each `tier-1/<agent>/` folder.

**Remaining "Mexican Gothic" / "placeholder" mentions are historical only** — they appear in narrative/reports (SUBMISSION_JOURNEY, comp-research-and-query-finalization, submission-package-report, agent-targeting-report) and in manuscript naming-audit reports, plus as guard-lines inside `tier-1/` checklists ("No Mexican Gothic anywhere"). None is an operational query send source.

---

## Manuscript sync (2026-06-29)
- Manuscript corrected to **100,253 words** (was 100,644). The 391-word trim fell **after Chapter 6**, so the first-50-pages sample content is unchanged and still renders at **exactly 50 pages**.
- All Tier 1 query materials now use query-standard **"approximately 100,000 words."** (Exact figure 100,253 recorded here and in the checklists.)
- Olivia Maidment and Sam Farkas **Query + first-50-pages DOCX regenerated** from the corrected, cleaned manuscript; verified clean — author "Abraham of London", no comments/tracked changes, and **no drafting/header/editorial-note text**.

## Final owner action
1. For **Olivia Maidment** and **Sam Farkas**: open the export folder, run `submission-checklist.md`, **verify the agency's current guidelines today**, attach the DOCX (trim the 50-page sample if the agent wants fewer), send manually from info@abrahamoflondon.org, then log it in `submission-tracker.md`. No AI disclosure in these queries (no stated policy); answer truthfully only if asked.
2. For **Judith Murray** (G&H) and **Jemima Forrester** (DH): the AI disclosure line is already in their queries. **Verify each agency's current AI stance day-of** and apply the practical rule (`ai-policy-review.md`) — send if it requires/permits disclosure; do not submit if it prohibits AI-assisted work without clarification; ask/hold if ambiguous. (G&H is paste-based; if DH requires Word attachments, generate the DOCX with the same generator — the disclosure is in the source query.)
3. Hold the alternates (Imogen, Nicola) until each primary same-agency query resolves; honour David Higham's one-agent rule.

**Nothing is sent automatically. Every send is a deliberate, owner-performed action.**
