# Interrupted Page Calibration Recovery Report

## Summary

The interrupted page-count calibration run was recovered without applying the partial outputs. The working tree was returned to a clean baseline before any stash inspection or further audit work.

Verdict: BLOCKED - DOCX samples remain underfilled and require a separate bounded calibration pass before submission use.

Push status: not pushed.

## Process Hang Identified

The interrupted run was `scripts/calibrate-fwf-submission-excerpts.py`.

Problems recorded:

- It wrote files before verification.
- It used hardcoded block counts.
- It had no timeout around LibreOffice conversion.
- It could hang indefinitely.
- It hand-generated DOCX XML.
- It left no durable progress report.
- It did not safely roll back failed output.
- It included untracked residue in the interrupted state.

The broken script was not restored and was not retained in the worktree.

## Processes Stopped

Command requested:

```powershell
Get-Process python,soffice,soffice.bin -ErrorAction SilentlyContinue | Stop-Process -Force
```

Result: no matching live calibration process remained after recovery checks. A subsequent process check returned no Python, soffice, or soffice.bin process output.

LibreOffice lock cleanup requested:

```powershell
Remove-Item "private/submission-packages/fathering-without-fear/current-package/.~lock.02-first-50-pages.docx#" -Force -ErrorAction SilentlyContinue
```

Result: no lock file remained in the clean worktree.

## Stash Created / Located

The requested stash command was attempted:

```powershell
git stash push -u -m "interrupted page calibration partial outputs - audit before use"
```

Initial sandboxed attempt failed because the Git worktree metadata is outside the writable sandbox. The approved rerun reported:

```text
No local changes to save
```

An existing interrupted calibration stash was already present and was inspected without applying it:

```text
stash@{0}: On main: interrupted page calibration partial outputs - do not use without audit
```

## Files Found In Stash

Inspected with:

```powershell
git stash show --include-untracked --name-status 'stash@{0}'
```

| File | Status in stash | Classification | Decision |
| --- | --- | --- | --- |
| `private/submission-packages/fathering-without-fear/current-package/02-first-50-pages.md` | Modified | partial/unverified output | Not restored |
| `private/submission-packages/fathering-without-fear/current-package/02-first-50-pages.docx` | Added | partial/unverified output | Not restored |
| `private/submission-packages/fathering-without-fear/wave-1/05-reiko-davis-defiore/personalised-query.md` | Modified | useful candidate source, unverified | Not restored |
| `private/submission-packages/fathering-without-fear/wave-1/exports/01-nicola-chang-dha/Fathering-Without-Fear-First-50-Pages-Nicola-Chang.docx` | Modified | useful regenerated DOCX, unverified | Not restored |
| `private/submission-packages/fathering-without-fear/wave-1/exports/01-nicola-chang-dha/first-50-pages-source.md` | Modified | useful candidate source, unverified | Not restored |
| `private/submission-packages/fathering-without-fear/wave-1/exports/03-elise-dillsworth/Fathering-Without-Fear-30-Page-Sample-Elise-Dillsworth.docx` | Modified | useful regenerated DOCX, unverified | Not restored |
| `private/submission-packages/fathering-without-fear/wave-1/exports/06-sarah-levitt-aevitas/sample-text-instructions.md` | Modified | useful candidate source, unverified | Not restored |
| `scripts/calibrate-fwf-submission-excerpts.py` | Added | temporary broken script | Discarded in stash only |
| `series-page.html` | Added | unrelated file | Discarded in stash only |

## Files Restored

None.

No full stash application was performed.

## Files Discarded

No files were deleted from history. The following interrupted artifacts were left quarantined in the stash and not restored:

- `scripts/calibrate-fwf-submission-excerpts.py`
- `series-page.html`
- unverified regenerated DOCX files
- unverified modified source excerpts

## Page-Targeted Files Audited

The following files are the page-targeted files requiring a future bounded correction pass:

- `private/submission-packages/fathering-without-fear/current-package/02-first-50-pages.md`
- `private/submission-packages/fathering-without-fear/wave-1/exports/01-nicola-chang-dha/first-50-pages-source.md`
- `private/submission-packages/fathering-without-fear/wave-1/exports/01-nicola-chang-dha/Fathering-Without-Fear-First-50-Pages-Nicola-Chang.docx`
- `private/submission-packages/fathering-without-fear/wave-1/exports/03-elise-dillsworth/Fathering-Without-Fear-30-Page-Sample-Elise-Dillsworth.docx`
- `private/submission-packages/fathering-without-fear/wave-1/05-reiko-davis-defiore/personalised-query.md`
- `private/submission-packages/fathering-without-fear/wave-1/exports/06-sarah-levitt-aevitas/sample-text-instructions.md`

Chapter-targeted files such as Kate Evans's Chapters 1-3 sample were not corrected because they are not labelled as a page-count excerpt.

## Rendered Page Counts

Bounded verification method:

- one DOCX converted at a time
- LibreOffice launched with `Start-Process`
- 120-second per-file timeout
- temporary PDF output directory
- temporary output cleaned after counting

| File | Labelled target | Rendered pages | Status |
| --- | ---: | ---: | --- |
| `wave-1/exports/01-nicola-chang-dha/Fathering-Without-Fear-First-50-Pages-Nicola-Chang.docx` | 50 | 20 | UNDERFILLED |
| `wave-1/exports/03-elise-dillsworth/Fathering-Without-Fear-30-Page-Sample-Elise-Dillsworth.docx` | 30 | 8 | UNDERFILLED |
| `wave-1/exports/02-kate-evans-pfd/Fathering-Without-Fear-Sample-Chapters-Chs1-3-Kate-Evans.docx` | Not page-targeted | 5 | NOT PAGE-TARGETED |

Final rendered page counts after correction: not applicable. No corrected output was restored or committed during this recovery pass.

## Files Changed By This Recovery

- `private/submission-packages/fathering-without-fear/architecture-and-audit/interrupted-page-calibration-recovery-report.md`

No manuscript prose was changed.

No partial calibration output was applied.

## Validation Results

| Command | Result |
| --- | --- |
| `pnpm contentlayer2 build` | PASS - 838 valid documents, 0 invalid |
| `pnpm typecheck` | PASS |
| `git diff --check` | PASS |
| `pnpm mdx:integrity` | PASS - scanned 114 files |
| `pnpm mdx:gate` | PASS - audited 1030 assets |
| `git status --short` | Pending final check |

Rendered DOCX page-count verification was performed with a 120-second timeout per file. Current exports remain underfilled and were not corrected in this recovery pass.

## Git State At Recovery

Commit hash at recovery baseline:

```text
7f5019476fd45cfd092a05e189669037263c819c
```

Branch status before this report file:

```text
main...origin/main [ahead 14]
```

Final git status after report creation must be checked before commit.

Push status: not pushed.
