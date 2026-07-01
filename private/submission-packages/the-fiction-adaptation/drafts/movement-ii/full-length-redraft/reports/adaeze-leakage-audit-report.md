# Old-Name Leakage Audit Report

## Executive Summary
- **Verdict:** PASS.
- **Dirty file found:** `content/source-material/fathering-without-fear/The Fiction Adaptation.mdx`.
- **Correction applied:** old central-figure placeholder replaced with **Obianuju** in the approved source-material exception.
- **Obianuju canonical:** confirmed.
- **Recommendation:** proceed to Ch.19 after owner accepts Ch.18; repository naming state is clean.

## Scope
Allowed exception applied to:
- `content/source-material/fathering-without-fear/The Fiction Adaptation.mdx`

Additional private package metadata cleanup:
- `private/submission-packages/the-fiction-adaptation/drafts/movement-i/README.md`
- `private/submission-packages/the-fiction-adaptation/drafts/movement-i/movement-i-drafting-report.md`
- `private/submission-packages/the-fiction-adaptation/drafts/movement-ii/full-length-redraft/reports/naming-realism-correction-report.md`

New report created in the Movement II report folder.

No Ch.1-18 prose was altered.

## Environment Note
The requested `grep` binary was not available in the PowerShell environment, and `wsl` was also unavailable. Equivalent `rg` searches were run with the same exclusions and matching intent.

## Commands Run
- `git status --short`
- `git diff -- "content/source-material/fathering-without-fear/The Fiction Adaptation.mdx"`
- `rg -n --hidden -g '!/.git/**' -g '!node_modules/**' -g '!.next/**' -g '!dist/**' -g '!out/**' "[old central figure name]" .`
- `rg -n -i --hidden -g '!/.git/**' -g '!node_modules/**' -g '!.next/**' -g '!dist/**' -g '!out/**' "[old central figure name]" .`
- `rg` secondary old-Igbo-name regression search using the full owner-supplied name set, excluding `naming-realism-correction-report.md`.
- `rg` broad old-name-prefix search with word-boundary matching across the fiction package and source-material tree.
- `rg -n -i "Obianuju" "content/source-material/fathering-without-fear/The Fiction Adaptation.mdx"`

## Search Results
- **Exact old-name search:** zero hits.
- **Case-insensitive old-name search:** zero hits.
- **Secondary Igbo-name regression search:** zero hits outside the intentionally excluded `naming-realism-correction-report.md`.
- **Broad word-boundary old-name-prefix search:** zero hits.
- **Canonical source-material hits:** `The Fiction Adaptation.mdx` now contains `Obianuju` / `OBIANUJU` at the working-name line and relevant structural notes.

## False Positives
- None remaining after cleanup.
- Historical old-name context was removed from general package metadata. The dedicated naming-realism correction report was also normalized so it no longer preserves the old placeholder string.

## Confirmations
- Old central-figure placeholder leakage cleared.
- `Obianuju` is canonical across active fiction materials and the approved source-material exception.
- No old secondary Igbo-name regression remains outside the intentionally excluded naming correction report.
- Obianuju and Kene remain the only approved Igbo given names in active fiction prose.
- Christian/public naming rule remains intact from Ch.15 onward.
- No memoir leakage introduced.
- No Ch.1-18 prose changed in this pass.
- No site routes, public book pages, Netlify/Vercel files, or build byproducts touched.

## Final Recommendation
Ready for Ch.19 after the Ch.18 acceptance decision.

*No push. No deploy. No merge. No upstream pull.*
