# The Five-Cut Loop Charter

**Version:** 1.0
**Effective Date:** 2026-06-30
**Status:** Active — Operating Doctrine
**Custodian:** Principal Architect
**Review Cycle:** Quarterly

---

## What This Charter Is

This is the canonical, plain-language definition of the **Five-Cut Loop** — the estate's first-principles discipline for deciding whether work should exist *before* deciding how to do it well.

It exists because of one observed failure mode, stated by Elon Musk and confirmed by this repository's own history:

> **"The most common mistake of smart engineers is to optimise a thing that should not exist."**

The estate has, in the past, optimised and automated things that should never have existed — recovery scripts for states the system should never enter, parallel config variants, firefight documentation. Each was excellent engineering aimed at the wrong question. The Five-Cut Loop is the corrective. **The order of the cuts is law.** You may not skip forward.

> **KEY PRINCIPLE**
>
> Cuts 1 and 2 (question, delete) must always precede Cuts 3, 4, and 5 (simplify, accelerate, automate). Optimising, speeding up, or automating anything that has not first survived deletion is a doctrine violation, not a shortcut.

---

## The Five Cuts

| # | Cut | The binding rule | The number that enforces it |
|---|-----|------------------|-----------------------------|
| **1** | **Question the requirement** | No work begins without a **named human owner** for the requirement. "The system requires it," "the framework needs it," or "we've always done it" is not an owner. Requirements are guilty until proven necessary — they are dumb to some degree no matter how smart the person who set them. | Every requirement carries an owner's name, not a department. |
| **2** | **Delete the part or step** | Try to remove it entirely — the file, the field, the route, the config variant, the document, the process step. Deletion is the default; retention must be argued. | **If you are not forced to add back at least 10% of what you delete, you did not delete enough.** Track the add-back rate. A 0% add-back rate means you were too conservative. |
| **3** | **Simplify / optimise** | Only what survived Cut 2 may be simplified. Optimising a deletion-candidate is forbidden. | Zero optimisation work on anything not first run through Cut 2. |
| **4** | **Accelerate** | Only simplified things get sped up. Speeding up an un-simplified step entrenches accidental complexity. | No performance work on un-simplified code. |
| **5** | **Automate** | Automate last. Automating a broken or unnecessary step makes it permanent. The estate's 26 historical `fix-*.ps1` recovery scripts are the cautionary monument to automating before deleting. | No new automation script without Cuts 1–4 logged. |

---

## The 10% Rule — How It Is Measured

Cut 2 is only real if it is measured. Every deliberate deletion is logged in the **Cut-2 Ledger** (the appendix of `docs/repository-hygiene-ledger.md`) with its outcome:

- **Deleted and stayed deleted** → the cut held.
- **Had to be added back** → record it as add-back.

`add-back rate = (items restored) / (items deleted)`

- **Below 10%** — the estate is being *too conservative*. Cut harder next cycle.
- **Around 10–30%** — healthy. You are deleting at the edge of necessity.
- **Far above 30%** — you are cutting load-bearing structure; slow down and improve Cut 1 (the requirements were real and under-understood).

The target is not zero add-back. The target is **discomfort**: if nothing ever bounces back, you stopped cutting too early.

---

## What Is Protected From Cut 2

> **WARNING**
>
> Cut 2 is pointed at firefight residue and unowned requirements. It is **never** pointed at the living core. The following have already survived deletion and are load-bearing. They are extended, never fragmented, never cut:

- The **Living Intelligence** layer (`lib/living-intelligence/*`) — the LivingStateObject contract, engine, adapters, view-models.
- The **EDOS** evidence and decision spine (see `docs/decision-spine-charter.md`).
- The **active** build configuration (`tsconfig.json`, `contentlayer.config.ts`, `next.config.mjs`).
- **Shared config and dependency manifests** (`package.json`, lockfiles, `next-env.d.ts`) — additionally, these may be owned by a concurrent process and must not be touched.
- The diagnostic, alignment, commercial, and decision-memory engines documented in the Engineering Manual.

This is the reconciliation of the Five-Cut Loop with the estate's standing law: **extend, don't fragment.** Those two rules are the same instruction seen from two sides. A *fragment* is precisely the thing Cut 2 should remove; the *living organism* is precisely what survives Cut 2 and earns Cuts 3–5. Deleting fragments is how the estate stays one system instead of "a big muddle of fragments."

---

## Enforcement Gates

The Five-Cut Loop is doctrine, not advice. It is enforced at four points:

1. **Every implementation plan** opens by answering the five cuts for that phase before any build step is listed.
2. **Every pull request** completes the Five-Cut checklist in `.github/PULL_REQUEST_TEMPLATE.md`. A PR that optimises without a logged delete attempt is incomplete by definition.
3. **The Definition of Clean** (Engineering Manual, Chapter 25) includes "survived Cut 2" as a condition of clean.
4. **The monthly Five-Cut review** reports the measured add-back rate and the net change in repository surface area (root files, config variants, automation scripts). A rising surface area with a 0% add-back rate is a red flag.

---

## Related Doctrine

- `docs/decision-spine-charter.md` — how decisions are governed (EDOS).
- `docs/memory-governance-charter.md` — how institutional memory is governed.
- `docs/repository-hygiene-ledger.md` — the Cut-2 Ledger lives here.
- Engineering Manual, Chapter 0 — the operational statement of this doctrine for engineers.

*Soli Deo Gloria.*
