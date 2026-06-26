# Wave 1 Ch20 Integration Lock Report

## Verdict

PASS — Wave 1 package materials have been brought into alignment with the 25-chapter manuscript after insertion of Ch.20, "The Available Tools."

Push status: not pushed.

## Ch.20 Integration

Ch.20 — "The Available Tools" is acknowledged as part of the active manuscript sequence.

Current active manuscript structure:

- 25 chapters
- approximately 48,700 prose-only words in the clean manuscript header
- approximately 49,000 words in outward-facing submission language
- Ch.20 — "The Available Tools"
- Ch.21 — "The Version in His Head"
- Ch.22 — "Damisi"
- Ch.23 — "Love Does Not Fear"
- Ch.24 — "Devotion"
- Ch.25 — "Final Room"

## Folder Structure

Verified active package root contains:

- `README.md`
- `architecture-and-audit/`
- `current-package/`
- `research-and-market/`
- `wave-1/`

No active current-package file remains stranded at the package root.

## Current Package Verification

Verified `current-package/` contains the active package set:

- `01-clean-manuscript.md`
- `02-first-50-pages.md`
- `03-query-letter.md`
- `04-one-page-synopsis.md`
- `05-long-synopsis.md`
- `06-author-bio.md`
- `06-nonfiction-proposal-core.md`
- `07-positioning-note.md`
- `08-legal-privacy-note.md`
- `09-agent-targeting-criteria.md`
- `10-agent-target-list.md`
- `10-submission-tracker.csv`
- `11-submission-wave-plan.md`
- `12-agent-personalisation-notes.md`

Current package files were checked and updated for 25-chapter / Ch.20 alignment where needed.

## Wave 1 Update

Wave 1 folder and exports were updated to reflect the 25-chapter package.

Updated areas include:

- agent-specific materials-to-send files
- personalised query text where chapter count appeared
- submission notes and checklists where package facts appeared
- field-ready QueryManager / Aevitas / email text
- DOCX source markdown
- chapter outline exports
- proposal export
- export-readiness reports
- metadata scrub reports for regenerated DOCX files

The historical `WAVE1_FORENSIC_AUDIT.md` remains retained as audit history only and is labelled as superseded. Historical stale facts inside that audit are intentionally retained as evidence of the older export state, not as current guidance.

## First 50 Pages

Checked `current-package/02-first-50-pages.md` against the opening of `current-package/01-clean-manuscript.md`.

Result:

- begins with `Chapter 1 — Hounslow Call`
- represents the current manuscript opening
- no stale total-chapter note remains
- no active author-detail placeholder marker remains

The late Ch.20 insertion does not alter the opening sample sequence.

## Synopsis / Query / Proposal Checks

Checked and updated:

- `03-query-letter.md`
- `04-one-page-synopsis.md`
- `05-long-synopsis.md`
- `06-nonfiction-proposal-core.md`

Result:

- outward-facing word count now uses approximately 49,000 words
- active structural references now use 25 chapters
- Ch.20 "The Available Tools" is present where synopsis/proposal structure requires it
- Ch.25 "Final Room" remains the ending

## Legal / Privacy Check

Result: PASS.

Confirmed:

- Ch.20 public package material contains no protected names from source-only material
- protected source material remains outside current-package and Wave 1 exports
- Ch.20 is described at pattern/structural level, not as legal pleading
- Damisi remains protected as a child, not evidence
- legal/privacy note now accounts for Ch.20 and the shifted chapter numbering

The only remaining author-detail placeholder hit in the Wave 1 folder is in the historical forensic audit, where it records a previous defect already remediated.

## DOCX Export Verification

Regenerated and text-extracted DOCX exports:

- Nicola Chang cover letter
- Nicola Chang first 50 pages
- Kate Evans cover letter
- Kate Evans chapter outline
- Kate Evans sample chapters 1-3
- Elise Dillsworth proposal
- Elise Dillsworth chapter outline
- Elise Dillsworth 30-page sample

Extraction checks confirmed:

- DOCX files contain real text
- no placeholder instructions remain in regenerated DOCX files
- no active stale prior-count or prior-word-count references remain
- "The Available Tools" appears in outline/proposal DOCX exports where structurally required
- metadata reports pass with no private metadata detected

## Stale Reference Audit

Active/current package result: PASS.

Resolved active references to:

- prior 24-count chapter wording
- prior 47k-word submission wording
- prior exact prose-count header wording
- prior Final Room chapter-number wording
- stale Ch.20/Ch.21/Ch.24 source slugs

Intentional historical exceptions:

- `wave-1/WAVE1_FORENSIC_AUDIT.md` retains superseded prior-count evidence as a historical audit record.

## Files Changed

Changed file set includes:

- source draft metadata for Ch.7 and Ch.21-Ch.25
- current-package active submission files
- historical audit notes marked superseded where needed
- Wave 1 agent materials
- Wave 1 DOCX exports and metadata reports
- Wave 1 export source markdown/text files
- this lock report

## Validation

Final validation results are recorded in the Codex final response for this lock pass.

Checks required:

- `pnpm contentlayer2 build`
- `pnpm typecheck`
- `git diff --check`
- `pnpm mdx:integrity`
- `pnpm mdx:gate`
- `git status --short`

## Final Status

Final git status, branch ahead count, and commit hash are recorded in the Codex final response after local commit.

Submission status:

- no submissions sent
- no forms opened
- no test forms submitted
- no emails sent
- no push performed
