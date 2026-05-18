# Pilot Data Boundary Policy

Status: internal policy summary for early-stage evaluations  
Last updated: 2026-05-18

The first pilot is intended to prove value without requiring premature institutional dependence.

## Required pilot boundary

1. Use sanitised or minimally sensitive information for the first pilot.
2. Do not use the platform as the system of record during the pilot.
3. Do not submit regulated or highly sensitive personal data without a separate review.
4. Limit the first pilot to one decision, one defined scope, and one review cycle.
5. Escalate to deeper security, legal, and procurement review before integration into critical workflows.

## Why this exists

This boundary reduces unnecessary exposure while the platform is still operating under current assurance posture rather than completed independent certification. It also makes the pilot easier to evaluate: one decision, one scope, one review cycle.

## Examples of suitable early pilot material

- a redacted operational decision;
- a commercial decision with names removed;
- a governance scenario where identifying details are replaced with role labels;
- a delayed-decision example using approximate rather than regulated figures.

## Material requiring separate review first

- regulated health, financial, or children’s data;
- highly sensitive personal data;
- privileged legal material;
- client data subject to contractual restrictions;
- any workflow where the platform would become the sole system of record or a mission-critical dependency.

## Escalation point

Before the platform is used beyond a bounded pilot, the buyer and operator should review:

- the legal entity and contracting path: Abraham of London is operated by Alomarada Ltd, a UK registered company. Company no. 11549053;
- sub-processor requirements;
- DPA requirements where relevant;
- data residency, transfer terms, and whether any region-specific commitment is required;
- analytics / telemetry configuration and any account-level restriction needed;
- incident-response posture;
- retention, deletion, backup, restore, and any RTO / RPO expectation;
- current status-page and incident-visibility posture;
- authentication posture, including the fact that enterprise SSO and enforced organisation-level MFA are not yet represented as generally available;
- whether independent assurance is required before deployment.
