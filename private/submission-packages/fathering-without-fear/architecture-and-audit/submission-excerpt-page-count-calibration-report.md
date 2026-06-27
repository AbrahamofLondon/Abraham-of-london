# Submission Excerpt Page Count Calibration Report

## Summary

Verdict: PASS

Recovery baseline commit: `4746eb752f3904673c32d65bb62758acab5fbed2`

Push status: not pushed.

The underfilled page-targeted submission samples were rebuilt from the locked manuscript at:

`private/submission-packages/fathering-without-fear/current-package/01-clean-manuscript.md`

No manuscript prose was rewritten. Excerpts were expanded or replaced only by copying consecutive manuscript paragraphs from the locked manuscript and stopping at clean paragraph boundaries.

## Method

DOCX generator used: `python-docx`.

Manuscript formatting used:

- Times New Roman
- 12 pt
- double-spaced body text
- 1-inch margins
- centered chapter headings
- no artificial font inflation
- no margin manipulation to fake page count

Render verification method:

- LibreOffice `soffice.com`
- one DOCX rendered at a time
- 120-second timeout per render
- temporary PDF output directory
- temporary PDFs deleted after counting pages

No unbounded LibreOffice loop was used.

## Files Audited And Corrected

| File | Target | Old rendered pages | Final rendered pages | Status |
| --- | ---: | ---: | ---: | --- |
| `wave-1/exports/01-nicola-chang-dha/Fathering-Without-Fear-First-50-Pages-Nicola-Chang.docx` | 49-50 | 20 | 50 | PASS |
| `wave-1/exports/03-elise-dillsworth/Fathering-Without-Fear-30-Page-Sample-Elise-Dillsworth.docx` | 29-30 | 8 | 30 | PASS |
| `current-package/02-first-50-pages.docx` | 49-50 | Not previously exported in current package | 50 | PASS |
| `wave-1/05-reiko-davis-defiore/personalised-query.md` first-20 paste section | 19-20 | Observed underfilled at approximately 7 pages | 20 | PASS |
| `wave-1/exports/06-sarah-levitt-aevitas/sample-text-instructions.md` first-50 paste block | 49-50 | Inherited underfilled first-50 scope | 50 | PASS |

## Source Word Counts And Ratios

| Sample | Source words before | Source words after | Calibration ratio used | Final rendered pages |
| --- | ---: | ---: | ---: | ---: |
| Nicola first 50 pages | 14,005 | 15,790 | 1.127x | 50 |
| Elise 30-page sample | 6,846 | 9,311 | 1.360x | 30 |
| Current-package first 50 pages | 14,018 | 15,803 | 1.127x | 50 |
| Reiko first 20 pages paste section | 5,071 planned words in placeholder guidance | 6,115 | 1.206x | 20 |
| Sarah first 50 pages paste block | 14,005 inherited first-50 scope | 15,790 | 1.127x | 50 |

The initial old rendered-page ratios were used as warnings that the excerpts were materially underfilled. Formatting was corrected to honest manuscript format first, then text volume was adjusted to the verified rendered page target.

## Files Changed

- `private/submission-packages/fathering-without-fear/current-package/02-first-50-pages.md`
- `private/submission-packages/fathering-without-fear/current-package/02-first-50-pages.docx`
- `private/submission-packages/fathering-without-fear/wave-1/exports/01-nicola-chang-dha/first-50-pages-source.md`
- `private/submission-packages/fathering-without-fear/wave-1/exports/01-nicola-chang-dha/Fathering-Without-Fear-First-50-Pages-Nicola-Chang.docx`
- `private/submission-packages/fathering-without-fear/wave-1/exports/03-elise-dillsworth/30-page-sample-source.md`
- `private/submission-packages/fathering-without-fear/wave-1/exports/03-elise-dillsworth/Fathering-Without-Fear-30-Page-Sample-Elise-Dillsworth.docx`
- `private/submission-packages/fathering-without-fear/wave-1/05-reiko-davis-defiore/personalised-query.md`
- `private/submission-packages/fathering-without-fear/wave-1/exports/06-sarah-levitt-aevitas/sample-text-instructions.md`
- `private/submission-packages/fathering-without-fear/architecture-and-audit/submission-excerpt-page-count-calibration-report.md`

## Files Deliberately Not Changed

- `wave-1/exports/02-kate-evans-pfd/Fathering-Without-Fear-Sample-Chapters-Chs1-3-Kate-Evans.docx`

Reason: this file is chapter-targeted, not page-targeted. It renders to 5 pages, but the requirement is Chapters 1-3 rather than a labelled page count.

## Validation Results

| Command | Result |
| --- | --- |
| `pnpm contentlayer2 build` | PASS - 838 valid documents, 0 invalid |
| `pnpm typecheck` | PASS |
| `git diff --check` | PASS |
| `pnpm mdx:integrity` | PASS - scanned 114 files |
| `pnpm mdx:gate` | PASS - audited 1030 assets |
| `git status --short` | PASS - only intended calibration files before commit |

Additional cleanup checks:

- No Python, `soffice`, or `soffice.bin` processes remained before commit.
- No LibreOffice lock files remained under the submission package.
- No temporary files remained under the submission package.

## Final Git State

Branch ahead count before calibration commit: 15.

Baseline HEAD before calibration commit: `4746eb752f3904673c32d65bb62758acab5fbed2`.

Commit hash for calibration commit: recorded in final operator response after local commit.

Push status: not pushed.
