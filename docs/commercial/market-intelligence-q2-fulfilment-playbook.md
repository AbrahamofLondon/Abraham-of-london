# Market Intelligence Q2 — Fulfillment Playbook

**Document ID:** MARKET_INTELLIGENCE_Q2_FULFILMENT  
**Effective Date:** 2026-06-14  
**Release Lane:** evidence_limited_commercial_product  
**Release Mode:** manual_fulfilment_only  

---

## Overview

Market Intelligence Q2 is sold via **manual fulfillment only**. Every purchase must be recorded in the fulfillment log with governance state, authority boundaries, and compliance verification before delivery.

**Critical Rule:** No Q2 report may be delivered until prior-quarter review status is recorded.

---

## Fulfillment Workflow

### Phase 1: Request Reception

**Trigger:** Customer completes request form at `/offers/global-market-intelligence-q2`

**Captured Data:**
- Customer name
- Company name
- Email address
- Use case / business context
- Acknowledgement checkbox (evidence boundary accepted)
- Request timestamp

**Action:** Route to intelligence@company.com for manual review

---

### Phase 2: Pre-Fulfillment Verification

**Before sending Q2 report, verify:**

1. **Governance State Check**
   ```
   productCode: gmi_quarterly
   releaseLane: evidence_limited_commercial_product
   releaseMode: manual_fulfilment_only
   commercialClaimAllowed: true
   commercialClaimBounded: evidence-limited-only
   ```

2. **Authority State Confirmation**
   ```
   currentAuthorityState: diagnostic_product_pending_evidence_validation
   positiveAuthorityGranted: false
   publicClaimAllowed: false
   ```

3. **Boundary Acknowledgement**
   ```
   Customer must have checked: "I acknowledge that this is evidence-limited 
   market intelligence designed for decision-support purposes and is not 
   investment advice, financial advice, or a prediction guarantee."
   ```

4. **Prior-Quarter Review Status**
   ```
   Q1 baseline report must exist at: 
   content/downloads/global-market-intelligence-report-q1-2026.mdx
   
   Q1 falsification register must document:
   - What we called for Q1
   - What actually happened
   - How the thesis adapted to evidence
   ```

---

### Phase 3: Fulfillment Record Creation

**For every purchase, create fulfillment record with:**

```json
{
  "fulfillmentId": "GMI_Q2_2026_[CUSTOMER_ID]_[DATE]",
  "timestamp": "2026-06-14T14:30:00Z",
  "productCode": "gmi_quarterly",
  "productName": "Global Market Intelligence Q2 2026",
  "customerName": "[CUSTOMER_NAME]",
  "customerEmail": "[CUSTOMER_EMAIL]",
  "customerCompany": "[COMPANY_NAME]",
  "useCase": "[BUSINESS_CONTEXT]",
  
  "governance": {
    "releaseLane": "evidence_limited_commercial_product",
    "releaseMode": "manual_fulfilment_only",
    "authorityState": "diagnostic_product_pending_evidence_validation",
    "positiveAuthorityGranted": false,
    "commercialClaimBounded": "evidence-limited-only"
  },
  
  "boundaries": {
    "boundaryVariant": "advisory_review",
    "boundaryStatement": "This is evidence-limited market intelligence. It is not investment advice, financial advice, or a prediction guarantee.",
    "customerAcknowledgement": true,
    "acknowledgementTimestamp": "[WHEN_CUSTOMER_CHECKED_BOX]"
  },
  
  "priorQuarterReview": {
    "required": true,
    "q1BaselineExists": true,
    "q1BaselineLocation": "content/downloads/global-market-intelligence-report-q1-2026.mdx",
    "falsificationRegisterExists": true,
    "falsificationRegisterLocation": "[Q2_REPORT_SECTION_REFERENCE]",
    "q1CallsDocumented": "[TRUE_OR_FALSE]",
    "q1OutcomesVerified": "[TRUE_OR_FALSE]"
  },
  
  "deliveryContent": {
    "format": ["PDF", "Web Access", "Board Deck"],
    "pdfReport": {
      "filename": "Global_Market_Intelligence_Q2_2026_[CUSTOMER_ID].pdf",
      "location": "secure/deliverables/[FULFILLMENT_ID]/",
      "pages": null,
      "generated": "[DELIVERY_DATE]"
    },
    "webDashboard": {
      "url": "https://intelligence.company.com/q2-2026/[ACCESS_TOKEN]",
      "expiresAfter": "2026-09-30T23:59:59Z",
      "accessGranted": "[DELIVERY_DATE]"
    },
    "boardDeck": {
      "filename": "GMI_Q2_2026_Board_Presentation_[CUSTOMER_ID].pdf",
      "location": "secure/deliverables/[FULFILLMENT_ID]/",
      "durationMinutes": 45,
      "generated": "[DELIVERY_DATE]"
    }
  },
  
  "contentVerification": {
    "containsInvestmentAdvice": false,
    "containsPredictionCertainty": false,
    "containsGuaranteedForecasts": false,
    "usesApprovedLanguageOnly": true,
    "forbiddenClaimsAbsent": true,
    "verificationBy": "[HUMAN_REVIEWER_NAME]",
    "verificationDate": "[DATE]"
  },
  
  "priorQuarterReviewStatus": {
    "q1MaterialCallsReviewed": true,
    "q1CallsReviewPath": "lib/intelligence/generate-gmi-digest.ts::getCallsPendingReview",
    "q1OutcomesDocumented": true,
    "falsificationRegisterIncluded": true,
    "workingThesisAdaptation": "[DOCUMENTED_IN_REPORT]"
  },
  
  "humanReviewCompletion": {
    "stage1_evidence_collection_verified": true,
    "stage2_thesis_validation_completed": true,
    "stage3_scenario_calibration_verified": true,
    "stage4_falsification_register_present": true,
    "stage5_boundary_compliance_checked": true,
    "stage6_authority_gate_passed": true,
    "reviewedBy": "[HUMAN_REVIEWER_NAME]",
    "reviewDate": "[DATE]"
  },
  
  "price": {
    "amount": "£[15000-25000]",
    "currency": "GBP",
    "billingPeriod": "Quarterly",
    "invoiceNumber": "[IF_APPLICABLE]"
  },
  
  "deliveryRecord": {
    "delivered": true,
    "deliveryDate": "[YYYY-MM-DDTHH:MM:SSZ]",
    "deliveredBy": "[TEAM_MEMBER_NAME]",
    "deliveryMethod": "Email + Web Portal",
    "confirmationEmail": {
      "sent": true,
      "sendDate": "[DATE]",
      "receiptConfirmed": "[TRUE_OR_FALSE]"
    }
  },
  
  "complianceAttestation": {
    "noAuthorityClaim": true,
    "noPredictionGuarantee": true,
    "noInvestmentAdvice": true,
    "priorQuarterReviewIncluded": true,
    "boundaryAccepted": true,
    "attestedBy": "[COMPLIANCE_OFFICER]",
    "attestationDate": "[DATE]"
  },
  
  "notes": "[ANY_ADDITIONAL_CONTEXT]"
}
```

---

## Required Verifications Before Delivery

### 1. **Prior-Quarter Review Status** (MANDATORY)

Before shipping ANY Q2 report, verify:

- [ ] Q1 2026 baseline report exists
- [ ] Q1 material calls are documented
- [ ] Actual Q1 market outcomes are recorded
- [ ] Falsification register shows matches/mismatches
- [ ] Working thesis adaptation is explained
- [ ] Path in code: `lib/intelligence/generate-gmi-digest.ts::getCallsPendingReview`

**Failure to verify = DO NOT DELIVER**

### 2. **Content Verification** (MANDATORY)

Scan report for forbidden claims:

- [ ] NO "investment advice"
- [ ] NO "guaranteed forecast"
- [ ] NO "AI predicts markets"
- [ ] NO "certified market intelligence"
- [ ] NO "externally verified signal"
- [ ] NO "prediction certainty"
- [ ] NO "markets will move"

If ANY forbidden claim found: **HALT DELIVERY**, remove claim, re-review, then deliver.

### 3. **Boundary Acceptance** (MANDATORY)

Confirm customer acknowledged:
```
"This is evidence-limited market intelligence. 
It is not investment advice, financial advice, 
or a prediction guarantee."
```

- [ ] Acknowledgement checkbox checked at request time
- [ ] Evidence of acceptance recorded in fulfillment record
- [ ] Boundary statement included in delivery materials

### 4. **Human Review Gate** (MANDATORY)

All 6 review stages must be complete:

- [ ] **Stage 1:** Evidence collection verified against primary data
- [ ] **Stage 2:** Working thesis tested against evidence
- [ ] **Stage 3:** Forward scenarios calibrated to evidence
- [ ] **Stage 4:** Claims tested for falsifiability
- [ ] **Stage 5:** Language audit (no investment advice, no certainty)
- [ ] **Stage 6:** Authority gate passed (7 gates all pass)

**Reviewer signature required**

---

## Delivery Materials Checklist

### PDF Report Must Include:

- [ ] **Title Page:** Evidence-Limited Quarterly Market Intelligence
- [ ] **Evidence Boundary Statement** (first section, visible)
- [ ] **Falsification Register** (Q1 calls vs. outcomes)
- [ ] **Working Thesis** (with evidence contradictions noted)
- [ ] **Forward Scenarios** (calibrated to evidence, not prediction)
- [ ] **Human Review Attestation** (date, reviewer name)
- [ ] **Methodology Boundary** (referenced, not full copy)
- [ ] **No Investment-Advice Disclaimer** (explicit)
- [ ] **Prior-Quarter Review Section** (how Q1 informs Q2)

### Web Dashboard Must Display:

- [ ] Evidence boundary statement (top of page)
- [ ] Prior-quarter review status
- [ ] Last updated timestamp
- [ ] Human review attestation date
- [ ] Methodology boundary link
- [ ] Access token expiration date (2026-09-30)

### Board Deck Must Include:

- [ ] Evidence-Limited Disclaimer (first slide)
- [ ] Methodology Overview (what sources, what not)
- [ ] Prior-Quarter Verification (Q1 review findings)
- [ ] Forward Scenarios (3–5 calibrated to evidence)
- [ ] Risk Scenarios (conditional on evidence)
- [ ] Not: Price targets, prediction certainty, investment advice

---

## Quarterly Delivery Schedule

**Q2 Report Delivery Window:** 2026-06-14 to 2026-08-31

**Acceptance Criteria:**
1. Q1 baseline reviewed ✓
2. Prior-quarter calls documented ✓
3. Outcomes verified against evidence ✓
4. Falsification register published ✓
5. Working thesis adapted ✓
6. All 6 human review stages complete ✓
7. No forbidden claims detected ✓
8. Customer boundary acceptance on file ✓

---

## Revocation / Halt Conditions

**IMMEDIATE HALT IF:**

1. **Forbidden claim detected** in final report before delivery
2. **Prior-quarter review missing** (no Q1 falsification register)
3. **Customer boundary acknowledgement not on file**
4. **Authority state changed** to blocked or restricted
5. **Governance matrix regenerated** with market_intelligence_q2 blocked
6. **Human review gate failed** (any of 6 stages incomplete)
7. **Falsification register shows fundamental thesis invalidation** (no recovery path)

**Action:** Do not deliver. Flag for owner decision and Q3 workflow planning.

---

## Q3 Preparation (In Progress)

As Q2 is delivered and Q3 approaches:

1. **Q2 Call Capture:** Document the material calls made in Q2 report
2. **Q2 Outcome Verification:** Track what actually happens in Q2
3. **Falsification Register Update:** Record Q2 calls vs. outcomes
4. **Q3 Working Thesis:** Adapt thesis based on Q2 evidence
5. **Q3 Authority Review:** Determine if evidence supports restoration

---

## Fulfillment Audit Trail

**All fulfillment records must be logged to:**
```
docs/commercial/market-intelligence-q2-fulfillment-log.json
```

Structure:
```json
{
  "auditTrail": [
    {
      "fulfillmentId": "GMI_Q2_2026_[ID]",
      "timestamp": "[ISO_DATE]",
      "action": "requested|verified|delivered|halted",
      "actor": "[TEAM_MEMBER]",
      "details": "[VERIFICATION_RESULT_OR_DELIVERY_METHOD]"
    }
  ]
}
```

---

## Escalation Protocol

**If delivery blocked or verification fails:**

1. **Document the reason** in fulfillment record with `reason: "..."` field
2. **Notify intelligence owner** with full fulfillment record
3. **Halt delivery** — do not proceed without explicit approval
4. **Flag for Q3 workflow review** — determine if evidence gap is recoverable
5. **Update product governance** if authority state changes

---

## Compliance Officer Sign-Off

Before first Q2 delivery:

- [ ] Fulfillment workflow reviewed and approved
- [ ] Prior-quarter review requirement understood and enforced
- [ ] Human review gate gate implementation verified
- [ ] Forbidden claims scanning automated (if possible)
- [ ] Fulfillment audit trail system operational

**Approved By:** [COMPLIANCE_OFFICER_NAME]  
**Date:** [DATE]  
**Authority:** Product Authority Contract, Market Intelligence Q2  

---

**Fulfillment Playbook Status:** ✓ DEFINED  
**Prior-Quarter Review Requirement:** ✓ ENFORCED  
**Authority Boundary:** ✓ ACKNOWLEDGED  
**Positive Authority Granted:** NONE  
