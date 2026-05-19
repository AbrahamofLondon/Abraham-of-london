# Security Assurance Pack Response Template

Status: internal response aid  
Last updated: 2026-05-18

Subject: Security Assurance Pack Request

Hello [Name],

Thank you for your request for the Abraham of London security assurance pack.

Before we send materials, please confirm:

1. your organisation;
2. your role in the review;
3. the intended evaluation or deployment context;
4. whether the request relates to a pilot, procurement review, or deeper integration assessment.

The current pack can cover:

- legal identity;
- infrastructure / provider posture;
- Cloudflare DNS and edge-security boundary;
- named sub-processors;
- administrative-access posture;
- MFA / SSO availability boundary;
- data-residency and transfer caveats;
- analytics / telemetry caveats;
- backup / restore and RTO / RPO caveats;
- status-page and incident-visibility caveats;
- pilot data-boundary guidance;
- incident-response posture summary;
- current independent-assurance status.

Current independent-assurance status:

- SOC 2: not yet completed;
- ISO 27001 organisational certification: not yet completed;
- independent external penetration testing: not yet completed.

For early pilot evaluations, we recommend using sanitised or minimally sensitive information and not treating the platform as a system of record until deeper review is complete.

Current infrastructure routing: Namecheap remains the registrar. Cloudflare is authoritative DNS for abrahamoflondon.org. Netlify remains the production application host/origin. Cloudflare proxying, WAF/rate-limiting, DLP, Zero Trust, mTLS, HSTS, and expanded edge-security controls are enabled only where explicitly configured and verified.

Some materials may be shared directly on request. Deeper architecture or security detail may require qualification and, where appropriate, NDA review before disclosure.

For procurement or vendor-risk review, an enterprise assurance RFI answer pack is available covering all standard questionnaire categories (legal entity, security assurance status, access control, data residency, privacy, sub-processors, operational resilience, provenance, insurance status, and roadmap). Some answers within the pack direct to contract or procurement review. Request through the security assurance process.

Regards,  
[Sender name]  
Abraham of London

---

## Notes for operator

- Insurance, liability, RTO/RPO, enterprise residency, SSO/MFA commitments: do not answer — direct to contract/procurement review.
- Cloudflare WAF/proxy/DLP/Zero Trust/mTLS/HSTS status: answer only from verified deployment scope.
- SOC 2, ISO 27001, pen-test: not yet completed — do not represent as complete.
- Analytics: do not represent as fully anonymised without account-level review.
- If a question is not answered in the approved materials: "to be confirmed during procurement review."
