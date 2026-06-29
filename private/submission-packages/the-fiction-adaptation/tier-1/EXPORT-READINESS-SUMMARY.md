# Export Readiness Summary — Tier 1
## The Fiction Adaptation

**Date:** June 29, 2026
**Build:** Planning + export folders fully populated; DOCX generated for sendable agents; reports reflect actual files.

---

## Readiness dimensions (honest status)

| Agent | Dir shell | Planning files | Export source files | DOCX generated | Metadata scrub | Actually sendable | Blocked-but-complete |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 01 Olivia Maidment (Madeleine Milburn) | ✅ | ✅ 6/6 | ✅ 5/5 | ✅ 4 files | ✅ verified | ✅ **yes** | — |
| 05 Sam Farkas (Jill Grinberg) | ✅ | ✅ 6/6 | ✅ 5/5 | ✅ 4 files | ✅ verified | ✅ **yes** | — |
| 02 Judith Murray (Greene & Heaton) | ✅ | ✅ 6/6 | ✅ 5/5 | paste-based (G&H) | ✅ states why | ✅ disclosure-ready* | — |
| 03 Imogen Morrell (Greene & Heaton) | ✅ | ✅ 6/6 | ✅ 5/5 | paste-based (G&H) | ✅ states why | alternate* | — |
| 04 Jemima Forrester (David Higham) | ✅ | ✅ 6/6 | ✅ 5/5 | gen day-of if DH wants attachments | ✅ states why | ✅ disclosure-ready* | — |
| 06 Nicola Chang (David Higham) | ✅ | ✅ 6/6 | ✅ 5/5 | gen day-of if DH wants attachments | ✅ states why | alternate* | — |

*AI-policy is **resolved** — the approved disclosure line is in each flagged query (after the bio). The only remaining gate is a **day-of agency-policy check** (apply the practical rule in `ai-policy-review.md`) plus same-agency / one-agent sequencing. Greene & Heaton is paste-based (query-letter-source.md is the deliverable); if David Higham requires Word attachments, generate the DOCX day-of with the same generator (disclosure is already in the source query).

---

## What each planning folder contains (all six)
- materials-to-send.md — method, subject, attachments/paste, same-agency + AI note
- submission-checklist.md — blockers + day-of + content + final approval
- submission-notes.md — why this agent, placement, risk/response handling
- personalised-query.md — exact corrected query text (agent-specific personalisation)
- guideline-verification.md — verification log with day-of row to complete
- ai-policy-note.md — flag status + (where relevant) owner-decision block + disclosure wording

## What each export folder contains (all six)
- query-letter-source.md — paste-ready corrected query
- synopsis-source.md — one-page + three-page (real text embedded)
- sample-pages-source.md — verified opening (~15,941 words, Ch.1–5 + opening of Ch.6), pass-notes stripped
- materials-to-send.md (export copy) + submission-checklist.md (export copy)
- export-readiness-report.md — verdict + folder contents + missing decisions
- metadata-scrub-report.md — real DOCX scrub (sendable) or explicit "no DOCX because blocked"

## DOCX present (sendable agents only)
**01 Olivia Maidment** and **05 Sam Farkas** each have:
- `..._Query_<slug>.docx` (~408 words, single-spaced letter)
- `..._1pSynopsis_<slug>.docx` (~550 words)
- `..._3pSynopsis_<slug>.docx` (~1,380 words)
- `..._<slug>_first-50-pages.docx` (~15,941 words (Ch.1–5 + opening of Ch.6), ~50 pages, double-spaced, header + page numbers)

All verified: open cleanly, author = "Abraham of London", no comments, no tracked changes, no hidden text.

**Manuscript sync (2026-06-29):** query text now reads "approximately 100,000 words" (manuscript corrected to 100,253; the trim fell after Ch.6, so the 50-page sample is unchanged and still renders at exactly 50 pages). Olivia and Sam Query + first-50-pages DOCX regenerated from the corrected, cleaned manuscript and re-verified clean.

---

## Corrections folded into this build
- Query text is the **corrected** version (Dept. of Speculation + Our Wives Under the Sea). The stale `submission/the-fiction-adaptation-query-letter-final.md` (still "Mexican Gothic" + placeholders) was **not** used; correct text is embedded inline in every folder.
- Four earlier shared-root scaffolding files that pointed to that stale file were removed.
- Sample pages have the manuscript's editorial pass-notes and `-->` markers stripped.

---

## Owner next actions
1. **Sendable now (after day-of guideline check):** Olivia Maidment, Sam Farkas. Open the export folder, run submission-checklist.md, verify guidelines, attach the DOCX (trim sample to required length), send, update submission-tracker.md.
2. **AI-policy decision** (ai-policy-review.md) before Judith Murray / Jemima Forrester. Generate their DOCX once unblocked.
3. **Alternates** (Imogen Morrell, Nicola Chang) only after the primary same-agency query resolves; honour David Higham's one-agent rule.

---

## Honest status line
Tier 1 production package is **complete**: two agents are genuinely sendable with clean DOCX; four are complete-but-blocked with paste-ready sources and no premature attachments. Reports match the files on disk.
