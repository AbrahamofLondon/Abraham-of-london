# Security Assurance Readiness

Status: internal procurement-readiness summary  
Last updated: 2026-05-18

This document states what is currently supportable, what is not yet independently assured, and what can be shared with prospective clients during a bounded evaluation. It is not a certification statement.

## Current assurance posture

Abraham of London currently exposes a documented security posture through:

- legal identity verification;
- named infrastructure providers;
- named sub-processors;
- published data-handling statements;
- responsible-disclosure contact and response posture;
- documented pilot data boundaries;
- internal provenance and auditability controls.

The platform does **not** currently claim completed SOC 2, ISO 27001 organisational certification, independent penetration testing, regulator approval, WORM retention, or external immutability.

## Legal operating entity

- Operating entity: Alomarada Ltd
- Jurisdiction: United Kingdom
- Company number: 11549053
- Operating identity: Abraham of London
- Public verification path: `/verification`

## Hosting / infrastructure providers

The public trust surface currently names:

- Netlify — hosting, CDN, and serverless functions;
- Neon / PostgreSQL — primary database;
- Upstash Redis — rate limiting and session caching;
- Resend — transactional email;
- Stripe — payment processing where applicable;
- Vercel Analytics / PostHog — anonymised product analytics.

## Authentication and access model summary

The public trust surface states that authentication is managed via NextAuth.js, with short-lived session tokens and magic-link / OAuth support. Admin and privileged routes are governed separately in the codebase and security documentation.

MFA support is **to be confirmed during procurement review**. It should not be claimed publicly unless the production configuration and user-facing control are verified.

## Data handling summary

The public trust surface currently states:

- governed case records, assessment results, session data, and authentication credentials may be stored;
- raw payment-card data is not stored directly by the platform;
- deleted cases are soft-deleted before permanent purge after 30 days;
- database encryption is managed by the hosting provider;
- application-level field encryption is applied to sensitive governance fields;
- daily automated backups are retained for seven days.

Prospective clients should use the pilot data boundary guidance before submitting any sensitive or regulated material.

## Sub-processors

Sub-processors are publicly named on `/trust` with their purpose and region. Any procurement review should confirm whether a current DPA, sub-processor addendum, or client-specific annex is required for the intended deployment.

## Incident response posture

The repository contains an internal incident response plan covering classification, containment, secret rotation, credential invalidation, clean rebuild, and post-incident documentation. Public trust wording states that material incidents are notified to affected accounts by email.

Current posture should be described as a **target response posture**, not a guaranteed SLA, unless a contractual SLA is separately agreed.

## Provenance and auditability boundary

Current supportable claim boundary:

- internal chain-anchored provenance;
- database-enforced append-only anchor ledger;
- hash-verifiable governed records;
- client-safe summaries that preserve hash continuity;
- admin verification of record hash and anchor-chain continuity.

Not yet live:

- external WORM retention;
- RFC3161 timestamping;
- blockchain anchoring;
- public verification receipts;
- third-party verification receipts.

These limits are documented in the provenance positioning and verification protocol documents and must remain explicit in procurement materials.

## Not yet completed

The following are **not yet completed**:

- SOC 2;
- ISO 27001 organisational certification;
- independent external penetration test.

They may be described as planned or prepared for review only when that remains true. They must not be presented as held, complete, or implied by founder credentials.

## Readiness roadmap

1. Maintain the current public trust pack and bounded pilot policy.
2. Keep the vendor security questionnaire and incident-response summary current.
3. Prepare scope, evidence, and remediation workflow for an external penetration test.
4. Commission an independent penetration test when the deployment stage requires it.
5. Use the resulting control evidence to decide whether SOC 2 Type I or ISO 27001 should be pursued for the relevant buyer segment.

## What can be shared with prospective clients today

- legal identity verification;
- public Trust Center;
- Security Review Pack page;
- vendor security questionnaire;
- pilot data boundary policy;
- incident response summary;
- sub-processor list;
- current provenance and auditability boundary;
- a clear statement of which independent assurances are not yet complete.

