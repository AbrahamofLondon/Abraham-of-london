# Security Pack Disclosure Process

Status: internal disclosure-control guide  
Last updated: 2026-05-18

The security assurance pack is intended for serious prospects and procurement stakeholders. It is not a public dump of internal security operations material.

## Disclosure classes

| Class | Meaning | Examples |
|---|---|---|
| Public summary | Safe for open publication on public trust surfaces | legal identity, named provider posture, sub-processor visibility, current independent-assurance status |
| Available on request | Suitable for serious prospects after a relevant request is received | security assurance readiness summary, vendor security questionnaire, pilot data boundary policy, incident-response posture summary |
| Available after qualification / NDA | May require buyer qualification, contextual review, and/or NDA before sharing | detailed architecture notes, detailed remediation records, deeper security-review materials, future independent-test reports where disclosure is appropriate |
| Not available | Should not be disclosed through ordinary buyer requests | secrets, raw credentials, exploit details, internal bypass paths, raw hostile-test artifacts, privileged admin procedures, sensitive incident evidence |

## Request path

1. Prospect requests the pack through the designated security-assurance contact path.
2. Request is reviewed for organisation, role, intended evaluation, and reasonable need.
3. Public-summary material may be shared immediately or linked publicly.
4. Available-on-request material may be sent where the request is legitimate and proportionate.
5. Any material beyond that threshold is reviewed for qualification, NDA, and data-minimisation before release.
6. Requests for unavailable material are declined or redirected to a safer summary.

## Baseline disclosure rule

Share the least sensitive material that answers the procurement question accurately.

## Current independent-assurance wording

Use:

- not yet completed;
- planned;
- available for procurement discussion;
- prepared for review.

Do not use:

- certified;
- pen-tested;
- regulator-approved;
- fully compliant;
- externally immutable.

## Enterprise assurance clarifiers

When answering serious procurement questions, keep the current boundaries explicit:

- Abraham of London is operated by Alomarada Ltd, a UK registered company. Company no. 11549053.
- Administrative access is limited to authorised operator/admin roles; detailed internal access procedures are available for procurement discussion rather than open publication.
- Enterprise SSO and enforced organisation-level MFA are not yet represented as generally available.
- Default infrastructure may involve UK/EU/US provider regions; region-specific deployment, residency commitments, transfer terms, DPA, and sub-processor review must be agreed during enterprise procurement.
- Cloudflare is authoritative DNS for abrahamoflondon.org. Namecheap remains the registrar, Netlify remains the production application host/origin, and Cloudflare proxying, WAF/rate-limiting, DLP, Zero Trust, mTLS, HSTS, and expanded edge controls must be treated as capability-specific unless verified for the relevant deployment scope.
- Product analytics may be used for usage, reliability, and product improvement; specific telemetry fields and account-level restrictions can be reviewed through the assurance process.
- Formal enterprise RTO/RPO commitments are not yet represented as generally available.
- A public status page is not yet published; internal health checks are not a public status history or uptime SLA.

## Enterprise RFI answer pack

An enterprise assurance RFI answer pack (`docs/security-assurance/enterprise-assurance-rfi-answer-pack.md`) provides structured honest answers to all standard vendor-risk questionnaire categories. It is registered in the material registry as `enterprise-assurance-rfi-answer-pack` (REQUESTABLE).

**When the RFI pack is requested:**
- Share via the controlled request process — not automatically or publicly
- Some answers within the pack direct to contract/procurement review (insurance, liability, RTO/RPO, enterprise residency, SSO/MFA)
- Do not answer beyond the pack's documented scope without escalation

## Items that require contract or procurement review (never answer by improvisation)

- Insurance coverage, cyber insurance, professional indemnity
- Contractual liability caps
- Formal RTO/RPO commitments
- EU-only or UK-only data residency guarantee
- Enterprise SSO/SAML and enforced MFA availability
- Cloudflare WAF/proxy/DLP/Zero Trust/mTLS/HSTS status
- Formal incident notification SLA

## Handling expectations

- Keep a copy of what was sent and when.
- Do not improvise claims outside the current public claim boundary.
- If a buyer asks for a fact not currently verified, respond with “to be confirmed during procurement review” rather than guessing.
- Escalate legal, security, or regulated-data questions before answering beyond approved materials.
- Use the vendor risk question index (`docs/security-assurance/vendor-risk-question-index.md`) to route questions quickly.
