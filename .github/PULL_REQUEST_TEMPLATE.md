<!--
Abraham of London — Pull Request
Every PR is governed by the Five-Cut Loop (docs/five-cut-loop-charter.md).
The cuts are ordered. Do not optimise (Cut 3+) anything you did not first try to delete (Cut 2).
-->

## The Five-Cut Loop

> Complete every cut. A PR that optimises, accelerates, or automates without a logged delete attempt is incomplete by definition.

### Cut 1 — Question the requirement
- **Requirement owner (a named person, not "the system"):**
- **Why this requirement is necessary (and why now):**

### Cut 2 — Try to delete it
- **What I tried to delete entirely (file / field / route / config / step):**
- **What I was forced to add back, and why:**
- **Add-back rate (logged in `docs/repository-hygiene-ledger.md` if it touches repo surface):** ___ %
- [ ] I confirm I genuinely attempted deletion before building. (A 0% add-back across the whole PR usually means I cut too little.)

### Cut 3 — Simplify / optimise
- **What survived Cut 2 and was then simplified:**
- [ ] I did **not** optimise anything that was a deletion candidate.

### Cut 4 — Accelerate
- **What was sped up (only after it was simplified), if anything:** N/A unless applicable.

### Cut 5 — Automate
- **What was automated last (only after Cuts 1–4), if anything:** N/A unless applicable.
- [ ] I did not add a new automation/`fix-*` script to entrench a step that should have been deleted.

---

## Institutional checks
- **The Strategic "Why":** what institutional constraint does this resolve?
- **Schema audit:** does this change the Prisma schema? Indexes verified?
- **Outcome proof:** screenshot or log trace of the successful outcome.
- [ ] Did not alter `middleware.ts` gating, `CRON_SECRET`, `innerCircleAccess`, or the `isMalicious` filter without Board approval.
- [ ] Change is **additive / extends** the living system — it does not fragment it (`feedback: extend, don't fragment`).
- [ ] Definition of Clean met (Engineering Manual, Chapter 25), including "survived Cut 2."

*Soli Deo Gloria.*
