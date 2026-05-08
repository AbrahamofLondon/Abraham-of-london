# Control Room Evidence Coverage Surface Plan

## Purpose

Define how `Governance Evidence Coverage` should be surfaced safely for sponsor audiences.

## Current State

Server-side coverage exists:

- cases with reported prior failure
- cases with recurrence signal
- cases with declared verification criteria
- cases with escalation trigger
- suppression reason where unsafe

This is currently safe at loader level and partially available in the enterprise control-room loader.

## Reliability Class

- `AGGREGATE_ONLY_MEMORY`

## What The Surface May Say

- `Evidence coverage is shown only where aggregation is safe.`
- `X cases include reported prior failure history.`
- `X cases include recurrence signals.`
- `X cases include declared verification criteria.`
- `X cases include escalation triggers.`

## What The Surface Must Not Say

- Anything implying respondent-level certainty
- Any raw text from carried evidence fields
- Any naming or singling out of a team, manager, or respondent
- Any language implying verified case truth from aggregate counts alone

## Required Source Framing

- Coverage reflects earlier captured governance evidence
- Coverage is about evidence presence, not about proof of resolution
- Coverage appears only where aggregation is safe

## Suppression Rules

- Suppress all counts when aggregation safety is not safe
- Show suppression reason instead
- Preserve small-sample suppression

## Minimal Delivery Hierarchy

1. Title: `Governance Evidence Coverage`
2. One-line boundary: `Evidence coverage is shown only where aggregation is safe.`
3. Aggregate counts only
4. Suppression reason where applicable

## Gating Standard For Sponsor Use

Safe for sponsor-facing use if:

- aggregation safety is safe
- raw text is absent
- no respondent-identifying detail is included
- counts are introduced as coverage, not truth

## Recommended Low-Risk Fixes

- Keep the current counts
- Ensure the sponsor-safe consumer visibly explains that the section measures coverage, not validity
- Add generated-at timestamp if the consumer later becomes visible
