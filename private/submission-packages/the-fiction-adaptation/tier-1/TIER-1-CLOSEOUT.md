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

## Superseded files (deprecated, not deleted unless noted)
- **Deleted:** the six old flat `submission/tier-1/*-query-package.md` (pre-rebuild duplicates, no external references).
- **Deprecated with banners** (kept for history) in `submission/`: `the-fiction-adaptation-query-letter-final.md` (STALE — Mexican Gothic + placeholders), `ai-policy-review.md`, `submission-tracker.md`, `pre-send-owner-checklist.md`.
- **Still canonical in `submission/`:** one-page synopsis, three-page synopsis, pitch-positioning, submission-package-report, agent-targeting-list/report/strategy, comp-research. (The corrected query also lives, self-contained, in each `tier-1/` folder.)

---

## Final owner action
1. Resolve AI-policy (`ai-policy-review.md`) before touching the Greene & Heaton / David Higham packages.
2. For **Olivia Maidment** and **Sam Farkas**: open the export folder, run `submission-checklist.md`, **verify the agency's current guidelines today**, attach the DOCX (trim the 50-page sample if the agent wants fewer), send manually from info@abrahamoflondon.org, then log it in `submission-tracker.md`.
3. Hold the alternates until each primary same-agency query resolves; honour David Higham's one-agent rule.

**Nothing is sent automatically. Every send is a deliberate, owner-performed action.**
