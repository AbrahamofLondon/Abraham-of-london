# GMI Release Event Ledger

**See also:** `docs/intelligence/market-intelligence-release-standard.md` · `docs/intelligence/gmi-buyer-assurance-pack.md` · `lib/intelligence/gmi-release-candidate-checklist.ts`

## Purpose

The Global Market Intelligence release event ledger records internal governance actions for the quarterly intelligence product line. It is designed to show how release state changed, which gates were run, what blocked release, which source rows were verified or rejected, and how prior calls were reviewed.

This is an internal audit/event log. It is not a public endpoint, blockchain anchor, WORM claim, or external immutability commitment.

## Event Types

- `GMI_QUALITY_GATE_RUN`
- `GMI_SOURCE_ROW_VERIFIED`
- `GMI_SOURCE_ROW_REJECTED`
- `GMI_CALL_REVIEWED`
- `GMI_CALL_CARRIED_FORWARD`
- `GMI_LIFECYCLE_TRANSITION_PROPOSED`
- `GMI_LIFECYCLE_TRANSITION_APPROVED`
- `GMI_LIFECYCLE_TRANSITION_REJECTED`
- `GMI_OUTBOUND_GATE_RUN`
- `GMI_RELEASE_BLOCKED`
- `GMI_RELEASE_APPROVED`

## Safe Metadata Rules

Release events may include:

- report identifiers
- related report identifiers
- source row identifiers
- call identifiers
- lifecycle states
- quality-gate scores
- blocker counts
- status labels
- release-safe summaries
- correlation/request identifiers

Release events must never include:

- unpublished report body
- source document full text
- raw research notes
- secrets, tokens, credentials, passwords, or private keys
- raw personal data
- unrestricted source extracts

The event builders in `lib/intelligence/gmi-release-events.ts` sanitise metadata and only retain primitive, console-safe values.

## Relationship To Provenance

The release event ledger is release governance memory. It records internal operational events behind source verification, call review, lifecycle decisions, and outbound gating.

It does not replace provenance records for client-facing artefacts, delivery records, or signed outputs.

## Relationship To The Release Console

The admin GMI release console consumes a console-safe release event summary. In v0, the console shows:

- last quality gate run
- last release blocker
- last source verification
- last call review
- last outbound gate check

If no events have been recorded, the console displays: `No release events recorded yet.`

## Current Limitation

The v0 ledger defines event contracts, builders, safe recording, and console-safe summaries. It uses the internal audit/event logging path when called by release operations. The console currently shows a deterministic no-events state until release operations begin recording events.
