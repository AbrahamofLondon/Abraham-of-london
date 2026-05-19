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

Abraham of London is operated by Alomarada Ltd, a UK registered company. Company no. 11549053.

- Jurisdiction: United Kingdom
- Public verification path: `/verification`

## Hosting / infrastructure providers

The public trust surface currently names:

- Cloudflare — authoritative DNS and edge-security services where enabled;
- Netlify — hosting, CDN, and serverless functions;
- Neon / PostgreSQL — primary database;
- Upstash Redis — rate limiting and session caching;
- Resend — transactional email;
- Stripe — payment processing where applicable;
- Vercel Analytics / PostHog — product analytics and telemetry where configured.

## Cloudflare DNS and Edge Security Boundary

Cloudflare currently serves as authoritative DNS for abrahamoflondon.org. The production application remains hosted on Netlify. Cloudflare edge security features are being configured progressively and should be treated as capability-specific, not blanket controls. Where a buyer requires proxying, WAF, rate limiting, DLP, Zero Trust, mTLS, HSTS, or specific residency/traffic-routing commitments, those controls must be confirmed during procurement review and reflected in the applicable deployment scope.

Namecheap remains the registrar. Cloudflare is authoritative DNS. Netlify remains the production application hosting/CDN origin.

## Authentication and access model summary

The public trust surface states that authentication is managed via NextAuth.js, with short-lived session tokens and magic-link / OAuth support.

Current authentication is handled through the platform's configured authentication provider and supported sign-in methods. Enterprise SSO and enforced organisation-level MFA are not yet represented as generally available. Availability can be reviewed for qualified enterprise deployments.

## Administrative access and internal review

Administrative access is limited to authorised operator/admin roles and is used for support, review, delivery, and security operations. Access to restricted assurance materials and operational records is controlled through admin review workflows. Certain provenance and admin operations are logged for review.

Detailed internal access procedures can be discussed during procurement or security review.

## Data handling summary

The public trust surface currently states:

- governed case records, assessment results, session data, and authentication credentials may be stored;
- raw payment-card data is not stored directly by the platform;
- deleted cases are soft-deleted before permanent purge after 30 days;
- database encryption is managed by the hosting provider;
- application-level field encryption is applied to sensitive governance fields;
- daily automated backups are retained for seven days.

Prospective clients should use the pilot data boundary guidance before submitting any sensitive or regulated material.

## Data residency and transfer posture

Default infrastructure may involve UK/EU/US provider regions depending on the service used. Region-specific deployment, data residency commitments, transfer terms, DPA, and sub-processor review must be agreed as part of enterprise procurement or contract review. The platform does not currently represent a blanket residency guarantee for all accounts.

## Analytics and telemetry

Product analytics may be used to understand usage, reliability, and product improvement. Analytics should not be used to sell personal data or for ad-tech sharing. Specific telemetry fields, analytics configuration, and account-level restrictions can be reviewed through the security assurance process.

## Backups and restore

The platform uses provider/database backup mechanisms appropriate to the current deployment. Daily automated backups are currently retained for seven days. Formal enterprise RTO/RPO commitments are not yet represented as generally available and should be agreed during enterprise procurement. Restore-testing posture and available evidence can be discussed through the security assurance request process.

## Sub-processors

Sub-processors are publicly named on `/trust` with their purpose and region. Any procurement review should confirm whether a current DPA, sub-processor addendum, or client-specific annex is required for the intended deployment.

## Incident response posture

The repository contains an internal incident response plan covering classification, containment, secret rotation, credential invalidation, clean rebuild, and post-incident documentation. Public trust wording states that material incidents are notified to affected accounts by email.

Current posture should be described as a **target response posture**, not a guaranteed SLA, unless a contractual SLA is separately agreed.

## Status page and incident visibility

A public status page is not yet published. Internal/system health checks exist, but they should not be read as a public status history or uptime SLA. For current pilots, incident communication expectations should be agreed within the engagement scope.

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
- administrative-access posture;
- MFA / SSO boundary;
- data-residency and transfer posture;
- Cloudflare DNS and edge-security boundary;
- analytics / telemetry caveat;
- backup / restore and RTO / RPO caveat;
- status-page and incident-visibility caveat;
- current provenance and auditability boundary;
- a clear statement of which independent assurances are not yet complete.
