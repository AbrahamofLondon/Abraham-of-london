# Vendor Risk Question Index

**Status:** Internal operator tool  
**Last updated:** 2026-05-18

Use this index to quickly locate the right answer source for each buyer question category. Prevents improvisation and keeps disclosure consistent.

| Question category | Answer source | Public? | Requires review? | Notes |
|---|---|---|---|---|
| Legal entity | `/verification`, `LegalIdentityBlock`, RFI pack §1 | Public | No | Alomarada Ltd, company no. 11549053, England & Wales |
| Contracting entity | RFI pack §1 | Requestable | Yes | Alomarada Ltd unless written agreement states otherwise |
| Companies House verification | RFI pack §1 (direct URL) | Public | No | Direct link to Companies House record |
| SOC 2 | RFI pack §2 | Requestable | Yes | Not yet completed — planned |
| ISO 27001 | RFI pack §2 | Requestable | Yes | Not yet initiated — planned if commercially justified |
| Penetration test | RFI pack §2 | Requestable | Yes | Not yet completed — scoped pen test is next step |
| Independent security audit | RFI pack §2 | Requestable | Yes | Not yet completed |
| Authentication model | RFI pack §3, vendor questionnaire | Requestable | Yes | Session-based; details in vendor questionnaire |
| Admin access controls | RFI pack §3, vendor questionnaire | Requestable | Yes | Role-restricted; certain operations logged |
| Audit logging | RFI pack §3 | Requestable | Yes | Partial — some admin/provenance ops logged; not comprehensive |
| Enterprise SSO / SAML | RFI pack §3 | Requestable | Yes | Not generally available — reviewable for enterprise |
| Org-level MFA | RFI pack §3 | Requestable | Yes | Not generally available — reviewable for enterprise |
| Data residency | RFI pack §4 | Requestable | Yes | No blanket guarantee; region review in enterprise contract |
| EU-only residency | RFI pack §4 | Restricted | Yes | Requires contract review; not available by default |
| Registrar | RFI pack §4 and §6 | Requestable | No | Namecheap |
| Authoritative DNS | `/trust`, RFI pack §4 and §6 | Public | No | Cloudflare for abrahamoflondon.org |
| Application host/origin | `/trust`, RFI pack §4 and §6 | Public | No | Netlify remains production application host/origin |
| Cloudflare WAF / rate limiting | RFI pack §6 | Requestable | Yes | Available/configurable where enabled; not universally represented as active |
| Cloudflare DLP / Data Classification | RFI pack §6 | Requestable | Yes | Not represented as operational for the public application |
| Cloudflare Zero Trust | RFI pack §6 | Requestable | Yes | Not represented as protecting all admin or user access |
| mTLS / client certificates | RFI pack §6 | Requestable | Yes | Not represented as active for public production application |
| HSTS | RFI pack §6 | Requestable | Yes | Not represented as enabled unless confirmed in live configuration |
| Backups | RFI pack §4 | Requestable | Yes | Provider-default (Neon); not a contractual RTO/RPO |
| RTO / RPO | RFI pack §4 | Restricted | Yes | Not represented; must be agreed in contract |
| Encryption at rest | RFI pack §4 | Requestable | Yes | Provider-managed |
| Encryption in transit | RFI pack §4 | Requestable | Yes | TLS 1.2+ |
| GDPR programme | RFI pack §5 | Requestable | Yes | GDPR-aligned; not formally certified |
| DPA | RFI pack §5 | Restricted | Yes | Available on request; share via security assurance process |
| Data subject rights | RFI pack §5 | Requestable | Yes | Deletion/export/rectification available; SLA requires contract |
| Sale of personal data | RFI pack §5 | Requestable | No | No personal data sold |
| DPO | RFI pack §5 | Requestable | Yes | No formal DPO; privacy contact available for enterprise |
| Analytics / telemetry | RFI pack §5, §6 | Requestable | Yes | Do not represent as fully anonymised without account-level review |
| Sub-processors | Sub-processor register, RFI pack §6 | Requestable | Yes | Full register with regions available on request |
| Sub-processor DPAs | RFI pack §6 | Restricted | Yes | In place / in progress; available for enterprise review |
| Public status page | RFI pack §7 | Requestable | No | Not yet published |
| Uptime history | RFI pack §7 | Requestable | No | No public uptime history |
| Target uptime | `/trust`, RFI pack §7 | Public | No | 99.5% target — not an SLA unless contracted |
| Incident notification SLA | RFI pack §7 | Restricted | Yes | No formal SLA; must be agreed in contract |
| Disaster recovery | RFI pack §7 | Restricted | Yes | Provider-default; formal DR requires enterprise agreement |
| Provenance / integrity | `/trust`, RFI pack §8 | Public (summary) | No | SHA-256 chain; internal anchoring; external WORM not live |
| External WORM / blockchain | RFI pack §8 | Requestable | No | Planned; not live |
| Insurance / professional indemnity | Contract review only | Restricted | Yes | Confirm during contract — do not answer without verification |
| Cyber insurance | Contract review only | Restricted | Yes | Confirm during contract — do not answer without verification |
| Liability cap | Contract review only | Restricted | Yes | Requires enterprise MSA |
| Security engineering (rate limiting, validation, error handling) | RFI pack §10, vendor questionnaire | Requestable | Yes | In active operation |
| SCA / dependency management | RFI pack §10 | Requestable | Yes | Periodic review; no formal automated SCA programme |
| Code review | RFI pack §10 | Requestable | Yes | Internal review; no external security code review yet |
| Enterprise contract / MSA | Contract review | Restricted | Yes | Negotiable; requires procurement engagement |

---

## Decision rule

When a buyer asks a question that is not in this index:
1. Do not guess.
2. Check the RFI pack and vendor questionnaire.
3. If still not found: respond with "to be confirmed during procurement review."
4. Escalate legal, security, or regulated-data questions before answering outside approved materials.

## Items that must never be improvised

- Insurance coverage (cyber, professional indemnity, liability)
- Contractual RTO/RPO
- Data residency guarantees beyond current documentation
- Cloudflare WAF, proxy, DLP, Zero Trust, mTLS, HSTS, or edge-protection coverage beyond verified deployment scope
- SOC 2 / ISO 27001 / pen-test completion status
- Regulator approval
- Enterprise SSO/MFA general availability
- External WORM/blockchain anchoring live status
