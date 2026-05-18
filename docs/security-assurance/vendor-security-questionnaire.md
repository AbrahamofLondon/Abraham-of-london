# Vendor Security Questionnaire

Status: internal procurement response aid  
Last updated: 2026-05-18

This document is intended to support early procurement conversations. Answers are deliberately bounded. Where a fact is not verified for public claim, the answer says so.

## 1. Who operates the platform?

Abraham of London is operated by Alomarada Ltd, a UK registered company. Company no. 11549053.

## 2. Where is the company registered?

United Kingdom. Company number: 11549053.

## 3. What infrastructure providers are used?

The public trust surface currently names Netlify, Neon / PostgreSQL, Upstash Redis, Resend, Stripe, and Vercel Analytics / PostHog.

## 4. What authentication model is used?

The public trust surface states that authentication is managed through NextAuth.js with short-lived session tokens and magic-link / OAuth support.

## 5. Is MFA / SSO supported?

Current authentication is handled through the platform's configured authentication provider and supported sign-in methods. Enterprise SSO and enforced organisation-level MFA are not yet represented as generally available. Availability can be reviewed for qualified enterprise deployments.

## 6. What data should pilots use?

Pilots should begin with sanitised or minimally sensitive information unless and until a deeper security and procurement review is complete.

## 7. Are sub-processors named?

Yes. Current sub-processors are named publicly on `/trust` with purpose and region.

## 8. What is the data residency posture?

Default infrastructure may involve UK/EU/US provider regions depending on the service used. Region-specific deployment, data residency commitments, transfer terms, DPA, and sub-processor review must be agreed as part of enterprise procurement or contract review. The platform does not currently represent a blanket residency guarantee for all accounts.

## 9. Is data encrypted in transit?

Yes. The public trust surface states that TLS 1.2+ is enforced and unencrypted HTTP is not used.

## 10. Is there an incident response process?

Yes. The repository contains an internal incident-response process covering classification, containment, assessment, remediation, and post-incident review. Public wording should describe this as an incident-response posture unless a contractual SLA is separately agreed.

## 11. Are SOC 2 / ISO 27001 certifications complete?

No. They are not yet completed and must not be claimed as held.

## 12. Has independent penetration testing been completed?

No. Independent external penetration testing has not yet been completed.

## 13. What analytics or telemetry are used?

Product analytics may be used to understand usage, reliability, and product improvement. Analytics should not be used to sell personal data or for ad-tech sharing. Specific telemetry fields and account-level restrictions can be reviewed through the security assurance process.

## 14. What is the backup / restore posture?

The platform uses provider/database backup mechanisms appropriate to the current deployment. Formal enterprise RTO/RPO commitments are not yet represented as generally available and should be agreed during enterprise procurement. Restore-testing posture and available evidence can be discussed through the security assurance request process.

## 15. Is there a public status page?

Not yet. Internal/system health checks exist, but they should not be read as a public status history or uptime SLA. For current pilots, incident communication expectations should be agreed within the engagement scope.

## 16. What is the recommended pilot data boundary?

- use sanitised or minimally sensitive data first;
- do not use the platform as the system of record during the pilot;
- do not submit regulated or highly sensitive personal data without separate review;
- limit the first pilot to one decision, one scope, and one review cycle;
- complete deeper security / procurement review before integration.
