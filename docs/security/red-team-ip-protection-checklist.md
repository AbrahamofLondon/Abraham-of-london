# Red-Team IP Protection Checklist

## Core Questions

- Can a competitor reconstruct scoring from client code, public content, or API responses?
- Can a user extract the decision spine from browser storage or DevTools?
- Can DevTools reveal thresholds, signal weights, routing rules, or arbitration traces?
- Can repeated probing infer internal bands or escalation boundaries?
- Can the UI reveal whether output came from fallback logic, deterministic logic, or AI synthesis?
- Can public MDX or static content reproduce toolkit logic or private evaluation mechanics?
- Can API responses leak intermediate values, raw graphs, source labels, or prompt traces?
- Can logs expose prompts, arbitration behavior, secrets, or hidden signal handling?

## Pass Conditions

- No public or client-observable layer exposes reproducible operating logic.
- Browser storage contains only opaque references, never the raw decision spine.
- Sanitized DTOs are the only outward-facing diagnostic/reporting payloads.
- Prompt fragments and arbitration rules remain server-only.
- Public content describes doctrine, evidence, and outcomes without numeric operating models.
- Audit scripts fail CI when protected concepts appear in prohibited public zones.

## Review Procedure

- Run `pnpm security:grep`.
- Run `pnpm security:bundle` after a build.
- Inspect browser `sessionStorage` and `localStorage` for raw decision artifacts.
- Inspect API responses for raw scores, thresholds, traces, and source labels.
- Inspect rendered pages and MDX for scoring bands, keyword maps, and fallback disclosures.
- Inspect server logs for prompts, salts, thresholds, and raw graph payloads.

## Current Red-Team Focus

- `lib/decision/**` still contains legacy client-visible decision mechanics and requires deeper migration.
- Public toolkit and diagnostic content should continue to be audited for threshold-like language.
- Any new diagnostic UX must default to server-only decision authority and sanitized public DTOs.
