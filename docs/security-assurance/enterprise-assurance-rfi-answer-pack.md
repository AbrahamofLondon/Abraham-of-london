# Enterprise Assurance RFI Answer Pack

**Status:** Internal controlled document — share via security assurance request process  
**Requesting:** `/contact?type=security-assurance&requested=enterprise-assurance-rfi-answer-pack`  
**Last updated:** 2026-05-18

This document provides structured, honest answers to standard enterprise vendor-risk, procurement, and security-review questionnaire categories. It is not an automatically public document. Share via the controlled request process only.

---

## 1. Legal entity and contracting

**Operator entity:** Abraham of London is operated by Alomarada Ltd.  
**Company number:** 11549053  
**Jurisdiction:** England and Wales, United Kingdom  
**Operating identity:** Abraham of London (trading under Alomarada Ltd)  
**Registered address:** Available through Companies House. Not disclosed publicly for security reasons.  
**Verification route:** [Companies House — Alomarada Ltd](https://find-and-update.company-information.service.gov.uk/company/11549053) and [Officers record](https://find-and-update.company-information.service.gov.uk/company/11549053/officers)

**Contracting entity statement:**  
The contracting entity for paid engagements is Alomarada Ltd unless a separate written agreement states otherwise. Contract review is required for enterprise deployment. Master service agreements, DPAs, and enterprise terms are negotiable through the procurement process.

---

## 2. Security assurance and testing

| Assurance item | Status |
|---|---|
| SOC 2 Type I | Not yet completed. Planned. |
| SOC 2 Type II | Not yet completed. |
| ISO 27001 organisational certification | Not yet initiated. Planned subject to enterprise demand. |
| Independent external penetration test | Not yet completed. Planned. Provider selection in progress. |
| Independent security audit | Not yet completed. |
| Internal security controls review | Ongoing. Access controls, rate limiting, secrets management, and error handling in active operation. |

**Important:** None of the above incomplete items are represented as completed. A scoped independent penetration test is the next recommended external assurance step.

If your procurement process requires completed SOC 2, ISO 27001 certification, or an independent penetration test report before evaluation, we recommend beginning the design partner programme or pilot programme while these are in progress.

---

## 3. Access control and identity

**Authentication model:** Session-based authentication with provider-managed credential storage. Passwords are not stored in plaintext. Auth provider manages credential hashing and session token lifecycle.

**User roles (high-level):**
- Authenticated user: standard platform access
- Admin / operator: elevated access to admin surfaces, review queues, and operational records
- Super-admin / owner: full operational access

**Admin access:** Restricted to authorised operator/admin roles only. Admin access is reviewed through internal admin process. Admin surfaces are not exposed without authentication.

**Privileged access:** Operator/admin access is authenticated and role-checked. Certain admin and provenance operations are logged for review.

**Audit logging:** Certain admin and provenance operations are logged. Comprehensive privileged-access logging across all operations is not yet represented as general availability.

**Enterprise SSO / SAML:** Not represented as generally available. Enterprise SSO and SAML integration are planned and can be reviewed for qualified enterprise deployments during contract negotiation.

**Enforced organisation-level MFA:** Not represented as generally available. Individual MFA is available via the authentication provider's supported methods. Enforced organisation-wide MFA is planned and can be agreed during enterprise procurement.

---

## 4. Data residency, storage, and backups

**Default infrastructure:** The platform uses a combination of providers whose infrastructure may involve UK, EU, and US regions depending on service. Specific provider regions are listed in the sub-processor register (available on request).

**Data-residency guarantee:** No blanket data-residency guarantee is made for all accounts by default. Region-specific deployment, EU-only or UK-only data residency, and associated transfer terms require enterprise contract review.

**Backups:** Backups are managed at the database-provider level (Neon/PostgreSQL) according to the provider's default backup configuration. The current deployment does not represent a contractual backup posture separate from provider defaults.

**RTO / RPO:** No formal contractual RTO or RPO commitment is represented at this stage. Target uptime is a 99.5% monthly operating target and is not an SLA unless separately agreed in contract. Formal RTO/RPO commitments must be agreed during enterprise procurement.

**Encryption at rest:** Provider-managed encryption at rest for database and storage layers.  
**Encryption in transit:** TLS 1.2+ for all data in transit.

---

## 5. Privacy and compliance

**GDPR programme status:** The platform operates with GDPR-aligned practices for data collection, retention, and rights fulfilment. A formal independently certified GDPR programme is not yet represented.

**CCPA / US state privacy laws:** Applicable where processing involves California residents. Formal CCPA programme documentation is not yet represented.

**Data Processing Agreement (DPA):** A DPA is available for enterprise and pilot use. Request through the security assurance process.

**Data subject rights:**
- Deletion: available on request via the operator/admin process
- Export: available on request via the operator/admin process
- Rectification: available on request
- Rights fulfilment timeline: target 30 days; subject to enterprise agreement for SLA-backed commitments

**Retention:** Decision records and user data are retained for the period required for the service. Retention policy details are available in the DPA.

**Sale of personal data:** No personal data is sold to third parties.

**DPO / Privacy lead:** No formal appointed Data Protection Officer is represented at this stage. Privacy and data-rights enquiries are handled through the assurance and contact process. A named privacy contact is available for enterprise accounts.

**Analytics and telemetry:** Product usage telemetry is used for usage monitoring, reliability, and product improvement. Where applicable, analytics use minimised or aggregated data. Specific telemetry fields, account-level opt-out, and restrictions can be reviewed through the assurance process. Analytics providers are listed in the sub-processor register.

---

## 6. Sub-processors and infrastructure

Current primary sub-processors (full register available on request with purpose, data category, and region detail):

| Sub-processor | Purpose |
|---|---|
| Neon (PostgreSQL) | Database |
| Upstash | Redis / caching |
| Resend | Transactional email |
| Stripe | Payments |
| Vercel / Netlify | Hosting and edge infrastructure |
| Vercel Analytics / PostHog | Product analytics and usage telemetry |

Specific region, data-sharing detail, and sub-processor DPA availability can be reviewed during procurement.

**DPA coverage:** Sub-processor DPAs are in place or in progress with primary providers. Sub-processor DPA documentation is available for review during enterprise procurement.

**Analytics payload detail:** Do not represent analytics data as fully anonymised unless specific account-level analysis confirms it. Default telemetry may include session or interaction signals. Specific payload and anonymisation boundaries are reviewable through the assurance process.

---

## 7. Operational resilience

**Public status page:** Not yet published. There is no current public uptime history or incident history feed.

**Health checks:** Internal health monitoring exists. This is not a public status history or uptime SLA.

**Target uptime:** 99.5% monthly operating target. This is not represented as a guaranteed uptime SLA unless separately agreed in contract.

**Incident communication:** No formal enterprise incident notification SLA is represented at this stage. Incident communication expectations for pilot and enterprise use should be agreed during procurement.

**Historical uptime reporting:** No historical public uptime report is available at this stage.

**Disaster recovery:** Recovery capability follows provider-level default (Neon/PostgreSQL backup retention). Formal disaster recovery planning with tested RTO/RPO is not yet represented. This can be reviewed and agreed during enterprise procurement.

---

## 8. Provenance and integrity

**Mechanism:** SHA-256 hash-based tamper-evidence on decision records. Records include a hash of their content; the chain includes the previous record hash (internal chain anchoring).

**Verification:** A verification endpoint returns the current hash state for authorised records. Client-safe summary boundaries are enforced — the verification layer does not expose internal operational records beyond its defined scope.

**Tamper-evidence boundary:** The hash changes when the record changes, and chain-continuity checks detect broken internal linkage. This is tamper-evidence, not absolute tamper-prevention. Database-level access outside the application layer is outside the application-layer guarantee.

**External WORM / blockchain anchoring:** Not live. External immutable anchoring via WORM storage or public blockchain is planned and not yet in production.

**What is not claimed:** External immutability, absolute tamper-prevention, regulator-approved integrity, or independently audited provenance.

---

## 9. Insurance and liability

**Current status:** Insurance coverage, professional indemnity, and cyber insurance terms are not publicly represented and must be confirmed through contract review.

**What to confirm during procurement:**
- Whether cyber/professional indemnity insurance is held
- Policy limits, scope, and applicable jurisdiction
- Whether the policy covers customer data incidents
- Liability cap under enterprise terms

Do not represent insurance coverage until confirmed during contract review.

---

## 10. Security engineering and engineering practices

**Secrets management:** Environment-variable based secrets management. No secrets are stored in source control. Secrets rotation process is in place.

**Rate limiting:** API rate limiting is implemented. Details available during security review.

**Input validation:** Server-side input validation on all API endpoints.

**Error handling:** Errors are logged server-side. Raw stack traces are not exposed to end users in production.

**Dependency management:** Dependencies are reviewed periodically. No formal automated SCA (Software Composition Analysis) programme is currently represented.

**Code review:** Code changes go through internal review. External security code review is not yet completed.

---

## 11. Roadmap and commitments

### Currently live
- Session-based authentication
- Role-based access control (user / admin / operator)
- SHA-256 hash-based tamper-evidence on decision records
- Internal chain anchoring
- API rate limiting
- Server-side input validation
- Structured security assurance request process and admin review queue
- Pilot data boundary guidance

### Planned — not yet completed
- Independent external penetration test (next recommended external step)
- Public status page
- SOC 2 readiness gap assessment (subject to enterprise demand)
- SOC 2 Type I
- Enterprise SSO / SAML integration
- Enforced organisation-level MFA
- External WORM / blockchain anchoring

### Requires contract / procurement review
- Formal RTO/RPO commitments
- EU-only or UK-only data residency guarantee
- Cyber/professional indemnity insurance confirmation
- Formal SLA-backed incident notification
- SOC 2 Type II timeline
- ISO 27001 (subject to commercial justification)
- DPO appointment confirmation
- Enterprise MSA and DPA terms

### Not represented
- Completed SOC 2 certification
- Completed ISO 27001 organisational certification
- Completed independent penetration test
- Independently audited provenance
- External WORM / blockchain anchoring live
- Contractual uptime SLA (default)
- Regulator approval
- Historical public uptime record

---

*All answers in this document reflect the platform's honest current state as of the document date. Items marked "planned" represent intent, not commitment, unless a separate written agreement states otherwise.*
