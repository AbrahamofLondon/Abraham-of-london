# Intelligence Foundry — Honesty Constitution

## Purpose

The Foundry is only useful if it is trusted. Trust requires honesty. These five laws are the
minimum standard every module must meet before it earns the right to surface a finding,
assign a status, or influence a decision.

---

## Law 1 — No False Labels

`WIRED` means the module runs production-representative logic against real inputs.
`DEMO` means the module runs illustrative logic for demonstration purposes only.

There is no third option. "Mostly wired", "partially wired", "wired but simplified" are
not statuses. A module is either WIRED or it is not. If in doubt, it is DEMO.

**Enforcement:** `real-logic-classifier.ts` validates WIRED qualification before status can be set.

---

## Law 2 — No Hidden DEMO

Every DEMO module must display, prominently and persistently:

> **DEMO — Illustrative only. Not production logic.**

This notice must appear:
- In the module header
- On every finding card produced by the module
- On every ResearchRun created by the module (`isDemo: true`)

Hiding the DEMO status by placing it in a tooltip, small print, or collapsed section
violates this law.

**Enforcement:** `DemoDisclaimer.tsx` must be rendered. Tests verify DEMO banner presence.

---

## Law 3 — No Score Without Source

Every score, severity rating, risk rating, or calculated output must expose:
- The rule, formula, or trigger that produced it
- The inputs that were evaluated
- What would change the score

A score that appears without its source is not a finding. It is noise with authority costumes on.

**Enforcement:** `FormulaInspector.tsx` must be used for all calculated outputs.
`research-run-validation.ts` rejects `findingsJson` entries without a `source` field.

---

## Law 4 — No Serious Finding Without a Path

HIGH or CRITICAL findings cannot be archived unless one of the following is true:
- `implementedAt` is set (the finding was acted on)
- `deferredReason` is set and non-empty (conscious deferral with stated reason)
- `decisionOutcome` is set (owner escalation was resolved)

Archiving a HIGH/CRITICAL finding without a path is not closure. It is burial.

**Enforcement:** `research-run-repository.ts` blocks archive operations that violate this rule.
`honesty-enforcer.ts` exposes `validateArchive()` which must pass before any archive call.

---

## Law 5 — No Module Claims More Than It Delivers

The module name, status field, and description field must match what the code actually does.
If a module is named "Security Red Team" but only runs a checklist with no automated scan,
its status is PARTIAL, not WIRED.

If the description says "detects IDOR vulnerabilities" but the code does not, the description
must be corrected before the module ships.

**Enforcement:** Module registry entries are reviewed against `real-logic-classifier.ts`.
A module cannot self-declare WIRED. WIRED must be approved via the classifier.

---

## Consequences of Violation

A module that violates any of these laws:
1. Cannot display as WIRED
2. Cannot create ACTION_REQUIRED findings that block CI
3. Must display a prominently visible DEMO or PARTIAL banner
4. Is flagged in Foundry Health as a honesty violation

These consequences are not punitive. They protect the Foundry's institutional value.
A Foundry that lies about what it does is worse than no Foundry at all.

---

*Last reviewed: 2026-05-24. This document is enforced by code, not convention.*
