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

**Held — AI-policy owner decision required:**
- Judith Murray — Greene & Heaton
- Jemima Forrester — David Higham Associates

**Alternate — same-agency backup (do not send while the primary is active):**
- Imogen Morrell — Greene & Heaton (backup to Judith Murray)
- Nicola Chang — David Higham Associates (backup to Jemima Forrester)

## AI-policy blockers
- **Greene & Heaton** (Judith, Imogen) and **David Higham** (Jemima, Nicola) carry AI-use restrictions. Owner must decide disclose / do-not-submit / submit-without-disclosure per `ai-policy-review.md` before any send. Madeleine Milburn and Jill Grinberg: no AI flag found (re-verify day-of).

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

## Final owner action
1. Resolve AI-policy (`ai-policy-review.md`) before touching the Greene & Heaton / David Higham packages.
2. For **Olivia Maidment** and **Sam Farkas**: open the export folder, run `submission-checklist.md`, **verify the agency's current guidelines today**, attach the DOCX (trim the 50-page sample if the agent wants fewer), send manually from info@abrahamoflondon.org, then log it in `submission-tracker.md`.
3. Hold the alternates until each primary same-agency query resolves; honour David Higham's one-agent rule.

**Nothing is sent automatically. Every send is a deliberate, owner-performed action.**
