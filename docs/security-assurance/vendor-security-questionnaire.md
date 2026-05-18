# Vendor Security Questionnaire

Status: internal procurement response aid  
Last updated: 2026-05-18

This document is intended to support early procurement conversations. Answers are deliberately bounded. Where a fact is not verified for public claim, the answer says so.

## 1. Who operates the platform?

Alomarada Ltd operates the platform under the Abraham of London operating identity.

## 2. Where is the company registered?

United Kingdom. Company number: 11549053.

## 3. What infrastructure providers are used?

The public trust surface currently names Netlify, Neon / PostgreSQL, Upstash Redis, Resend, Stripe, and Vercel Analytics / PostHog.

## 4. What authentication model is used?

The public trust surface states that authentication is managed through NextAuth.js with short-lived session tokens and magic-link / OAuth support.

## 5. Is MFA supported?

To be confirmed during procurement review. Do not assume MFA support without a verified production statement.

## 6. What data should pilots use?

Pilots should begin with sanitised or minimally sensitive information unless and until a deeper security and procurement review is complete.

## 7. Are sub-processors named?

Yes. Current sub-processors are named publicly on `/trust` with purpose and region.

## 8. Is data encrypted in transit?

Yes. The public trust surface states that TLS 1.2+ is enforced and unencrypted HTTP is not used.

## 9. Is there an incident response process?

Yes. The repository contains an internal incident-response process covering classification, containment, assessment, remediation, and post-incident review. Public wording should describe this as an incident-response posture unless a contractual SLA is separately agreed.

## 10. Are SOC 2 / ISO 27001 certifications complete?

No. They are not yet completed and must not be claimed as held.

## 11. Has independent penetration testing been completed?

No. Independent external penetration testing has not yet been completed.

## 12. What is the recommended pilot data boundary?

- use sanitised or minimally sensitive data first;
- do not use the platform as the system of record during the pilot;
- do not submit regulated or highly sensitive personal data without separate review;
- limit the first pilot to one decision, one scope, and one review cycle;
- complete deeper security / procurement review before integration.

