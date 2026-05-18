# Security Assurance Request Workflow

Internal process for handling controlled security assurance material requests.

---

## 1. How requests arrive

Requests arrive through two channels:

**Structured intake (preferred)**
Prospect clicks "Request this material" or "Request review" on `/security-review`, which links to `/contact?type=security-assurance&requested={materialId}`. The contact page shows a pre-filled material banner, captures organisation/role/procurement stage, and submits to `POST /api/security-assurance/request`. The record is created in the database with `status=NEW` and a Discord notification is sent to the admin channel.

**General contact form**
Prospect selects "Security assurance pack" from the enquiry type dropdown on `/contact` (without a `?requested=` param). This routes through the standard `POST /api/contact` flow (email only, no database record). Admin receives the email and should create a manual follow-up if appropriate.

---

## 2. How to classify the requester

Before sharing any material, assess:

| Signal | What it means |
|--------|---------------|
| Named organisation | Reduces likelihood of speculative request |
| Specific procurement stage | Indicates genuine due diligence process |
| Specific material requested | Suggests familiarity with the platform |
| Email domain matches stated organisation | Basic identity signal |
| Coherent message | Credible use case |

If any of these is absent, ask for clarification before proceeding.

---

## 3. Disclosure levels

| Level | Meaning | Action required |
|-------|---------|----------------|
| `PUBLIC` | Summary available on the public site | Direct to `/trust` or `/security-review` |
| `REQUESTABLE` | Available after operator review | Review request, approve via admin queue, share manually |
| `RESTRICTED` | Requires NDA and explicit approval | Confirm identity, send NDA, await signature, then share |

---

## 4. What can be shared publicly

- **Security Assurance Readiness Overview** — public at `/trust`
- **Pilot Data Boundary Policy** (summary) — public at `/trust#pilot-data-boundary`

These require no request and no review. Direct prospects to the relevant URL.

---

## 5. What requires review before sharing

- **Vendor Security Questionnaire** — share after verifying requester is a genuine procurement contact
- **Incident Response Summary** — share to serious prospects; confirm organisation
- **Sub-Processor Register** — share after basic qualification; updated quarterly

For these materials:
1. Review the request in `/admin/security-assurance-requests`
2. Set status to `UNDER_REVIEW`
3. Verify the requester's organisation and role if unclear
4. Set status to `PUBLIC_PACK_APPROVED` once satisfied
5. Copy the response template and send the material manually via email

---

## 6. What requires NDA before sharing

- **Independent Penetration Test Readiness** — not yet completed; share internal status only under NDA
- **Procurement Security Review Call** — detailed architecture/call materials shared under NDA only

For these materials:
1. Review the request in `/admin/security-assurance-requests`
2. Set status to `NDA_REQUIRED`
3. Use the NDA template and send to the requester's email address
4. Await countersigned NDA return
5. Set status to `RESTRICTED_PACK_APPROVED`
6. Share the material manually via email with standard confidentiality notice

---

## 7. What must not be shared

- Internal system architecture diagrams beyond what is disclosed in the assurance pack
- Credentials, API keys, or secrets of any kind
- Source code or internal implementation details
- Unreleased SOC 2, ISO 27001, or pen-test reports (none exist)
- Any claim that certifications are complete when they are not
- Internal doc paths (do not share `internalDocPath` values from the registry)

---

## 8. Enterprise-boundary prompts to preserve

When handling a serious request, keep these current boundaries intact:

- Abraham of London is operated by Alomarada Ltd, a UK registered company. Company no. 11549053.
- Administrative access is limited to authorised operator/admin roles and restricted materials are controlled through admin review workflows.
- Enterprise SSO and enforced organisation-level MFA are not yet represented as generally available.
- Default infrastructure may involve UK/EU/US provider regions; data residency commitments, transfer terms, DPA, and sub-processor review must be handled in procurement or contract review.
- Product analytics may be used for usage, reliability, and product improvement; specific telemetry fields can be reviewed through the security assurance process.
- Formal enterprise RTO/RPO commitments are not yet represented as generally available.
- A public status page is not yet published; current pilots should agree incident communication expectations within scope.

---

## 9. Admin queue statuses

| Status | Meaning |
|--------|---------|
| `NEW` | Request received; not yet reviewed |
| `UNDER_REVIEW` | Operator has started review; awaiting decision |
| `PUBLIC_PACK_APPROVED` | Approved for public/requestable materials; pending manual send |
| `NDA_REQUIRED` | Restricted material requested; NDA must be sent and signed before sharing |
| `RESTRICTED_PACK_APPROVED` | NDA signed; restricted material approved; pending manual send |
| `DECLINED` | Request declined; response sent explaining reason |
| `FULFILLED` | Material shared; record closed |

Update status in `/admin/security-assurance-requests`. Status changes are logged with `updatedAt` timestamp.

---

## 10. Manual fulfilment checklist

Before marking `FULFILLED`:

- [ ] Material shared via email (not auto-sent, not attached to this system)
- [ ] Requester email confirmed correct
- [ ] Organisation verified (if material is REQUESTABLE or RESTRICTED)
- [ ] NDA countersigned and on file (if material is RESTRICTED)
- [ ] Decision note added to admin queue record
- [ ] Status set to `FULFILLED`

---

## 11. Response templates

Templates are available in the admin queue (`/admin/security-assurance-requests`) per request. Use "Copy template" to copy the pre-filled template for the current status.

Available templates:
- `PUBLIC_PACK_APPROVED` — directs to public URL
- `NDA_REQUIRED` — requests NDA agreement before sharing
- `RESTRICTED_PACK_APPROVED` — confirms material is being shared under NDA
- `DECLINED` — politely declines with reason

All templates must be reviewed before sending. They are starting points, not automated sends.

---

## 12. Recordkeeping expectation

- All requests are stored in `SecurityAssuranceRequest` (database table: `security_assurance_requests`)
- Records should not be deleted; set to `DECLINED` or `FULFILLED` when resolved
- Decision notes should explain why a request was approved, declined, or escalated
- NDA documents should be stored in a secure offline location (not in this system)
- The admin queue is not a document store; it tracks request state only

---

## 13. Enterprise RFI answer pack

An enterprise assurance RFI answer pack exists at `docs/security-assurance/enterprise-assurance-rfi-answer-pack.md`. It covers all 10 standard vendor-risk categories including legal entity, security assurance status, access control, data residency, privacy, sub-processors, operational resilience, provenance, insurance, and roadmap.

- The RFI pack is registered as `enterprise-assurance-rfi-answer-pack` in the material registry
- It is `REQUESTABLE` — share via the controlled request process, not automatically
- Some answers within the pack direct to contract/procurement review (insurance, liability, RTO/RPO, enterprise residency, SSO/MFA commitments)
- Unknown items in the pack must not be guessed — use "to be confirmed during procurement review"
- A vendor risk question index is at `docs/security-assurance/vendor-risk-question-index.md` — use it to route questions to the right answer source quickly

## 14. Items that must never be closed by wording

The following require real external work and must remain honestly marked:

- Independent penetration test
- SOC 2 Type I and Type II
- ISO 27001
- Public status page
- Historical uptime reporting
- Contractual RTO/RPO
- Enterprise SSO / SAML
- Enforced organisation-level MFA
- Formal DPO/privacy governance
- Cyber/professional indemnity insurance confirmation
- External WORM/blockchain anchoring

Roadmap at `docs/security-assurance/external-assurance-roadmap.md`.

---

*Last updated: 2026-05-18*
