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
- Product analytics may be used for usage, reliability, and product improvement; specific telemetry fields and account-level restrictions can be reviewed through the assurance process.
- Formal enterprise RTO/RPO commitments are not yet represented as generally available.
- A public status page is not yet published; internal health checks are not a public status history or uptime SLA.

## Handling expectations

- Keep a copy of what was sent and when.
- Do not improvise claims outside the current public claim boundary.
- If a buyer asks for a fact not currently verified, respond with “to be confirmed during procurement review” rather than guessing.
- Escalate legal, security, or regulated-data questions before answering beyond approved materials.
