# Multi-User Operating Model

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London

---

## Canonical Entities

### Organisation
**Meaning:** An institutional entity that sponsors assessments, owns campaigns, and governs team/enterprise decision infrastructure.
**Lifecycle:** Created → Active → Monitored → Retained | Inactive
**Create:** Admin/Operator. **View:** Members, Sponsors, Admin. **Modify:** Admin, Sponsor (limited).
**Scope:** Enterprise. **Living Case:** Contains enterprise-level Living Cases.

### Workspace
**Meaning:** A logical grouping within an Organisation for team-level campaigns and assessments.
**Lifecycle:** Created → Active → Archived
**Create:** Sponsor, Admin. **View:** Workspace members. **Modify:** Sponsor, Admin.
**Scope:** Team. **Living Case:** Contains team-level Living Cases.
**Current model:** Implicit via `teamName` on OrganisationMembership. No explicit Workspace model yet.

### Actor
**Meaning:** Any participant in the system — user, sponsor, respondent, operator.
**Lifecycle:** Identified → Active → Accountable → Verified
**Create:** Self-registration, invitation, admin grant. **View:** Self, Admin. **Modify:** Self (limited), Admin.
**Scope:** Individual. **Living Case:** Owns or participates in Living Cases.
**Current models:** `User`, `InnerCircleMember`, `CampaignParticipant`, `OrganisationMembership`

### Role
**Meaning:** An actor's function within an Organisation or Campaign.
**Values:** Sponsor | Decision Owner | Respondent | Observer | Reviewer | Admin | Operator
**Lifecycle:** Assigned → Active → Revoked
**Create:** Admin, Sponsor. **View:** Organisation members. **Modify:** Admin, Sponsor.
**Scope:** Organisation or Campaign. **Living Case:** Determines visibility and edit rights.
**Current model:** `roleTitle` on OrganisationMembership. `MemberRole` on InnerCircleMember.

### Campaign
**Meaning:** A coordinated assessment exercise collecting responses from multiple participants.
**Lifecycle:** Created → Open → Collecting → Closed → Analysed → Archived
**Create:** Sponsor, Admin. **View:** Sponsor, Participants (own responses), Admin. **Modify:** Sponsor (until closed), Admin.
**Scope:** Team or Enterprise. **Living Case:** Generates evidence nodes and divergence patterns.
**Current model:** `AlignmentCampaign`, `TeamAssessmentCampaign`

### Invitation
**Meaning:** A time-bound, token-authenticated request for a respondent to participate in a Campaign.
**Lifecycle:** Issued → Sent → Accepted → Completed | Expired | Declined
**Create:** Campaign system. **View:** Sponsor (status only), Respondent (own). **Modify:** System (status transitions).
**Scope:** Campaign. **Living Case:** Completion triggers evidence node creation.
**Current model:** `TeamAssessmentInvite`, `CampaignParticipant`

### Respondent
**Meaning:** A person who provides assessment responses within a Campaign. May be named or anonymous.
**Lifecycle:** Invited → Responding → Completed
**Create:** Via invitation. **View:** Self (own responses), Sponsor (aggregated only unless named mode). **Modify:** Self (during response window).
**Scope:** Campaign. **Living Case:** Individual responses feed aggregation; raw data protected.
**Privacy:** Named mode: identity visible to sponsor. Anonymous mode: only aggregated signals visible.

### Response
**Meaning:** A single respondent's assessment answers within a Campaign.
**Lifecycle:** Started → Submitted → Validated → Aggregated
**Create:** Respondent. **View:** Self, Sponsor (aggregated unless named mode), Admin. **Modify:** None after submission.
**Scope:** Campaign. **Living Case:** Feeds evidence nodes and divergence detection.
**Current model:** `TeamAssessmentResponse`, `EnterpriseAssessment`

### Aggregated Signal
**Meaning:** A computed signal from multiple responses within a Campaign — perception gaps, fragility indices, domain weaknesses.
**Lifecycle:** Computed → Published → Superseded
**Create:** System (automatic on campaign close). **View:** Sponsor, Admin. **Modify:** None (derived).
**Scope:** Team or Enterprise. **Living Case:** Core evidence input for team/enterprise Living Cases.
**Current model:** `TeamAssessmentAggregate`, `OrganisationAssessmentSnapshot`

### Divergence Pattern
**Meaning:** A detected disagreement between respondent groups — e.g., leadership says X, team says Y.
**Lifecycle:** Detected → Confirmed → Escalated → Resolved
**Create:** System. **View:** Sponsor, Admin. **Modify:** None (derived).
**Scope:** Team or Enterprise. **Living Case:** Triggers escalation and contradiction evidence.

### Living Case
**Meaning:** The atomic product object — a persistent, server-authoritative intelligence container.
**Lifecycle:** Open → Active → Under Intervention → Monitoring → Resolved | Persistent
**Create:** System (on first diagnostic). **View:** Case owner, Sponsor (org cases), Admin. **Modify:** System only.
**Scope:** Individual, Team, or Enterprise. **Living Case:** IS the Living Case.
**Current model:** Derived from `DiagnosticJourney` via `deriveLivingCase()`

### Entitlement
**Meaning:** A verified right to access a product surface.
**Lifecycle:** Granted → Active → Expired | Revoked
**Create:** Payment, Admin grant, Sponsorship. **View:** Owner, Admin. **Modify:** Admin.
**Scope:** Individual or Organisation. **Living Case:** Determines which surfaces can be accessed.
**Current model:** `Entitlement`, `ClientEntitlement`

### Admission
**Meaning:** A server-validated decision that a case is admissible for a deeper surface.
**Lifecycle:** Evaluated → Admitted | Restricted → Re-evaluated
**Create:** System (admission modules). **View:** Case owner, Admin. **Modify:** System only.
**Scope:** Per case, per surface. **Living Case:** Attached to case as governance event.
**Current model:** `evaluateStrategyRoomAdmission()`, `evaluateERAdmission()`

### Intervention
**Meaning:** A governed action taken within Strategy Room or via directed next step.
**Lifecycle:** Proposed → Directed → Acknowledged → Executed → Verified
**Create:** Strategy Room engine. **View:** Case owner, Sponsor, Admin. **Modify:** Case owner (execution), System (verification).
**Current model:** `StrategyRoomExecutionSession`, `StrategyDecisionLog`

### Outcome
**Meaning:** Verified result of intervention at 14/30 days.
**Lifecycle:** Pending → Observed → Classified → Calibrated
**Create:** System. **View:** Case owner, Sponsor, Admin. **Modify:** None (observed).
**Current model:** `OutcomeVerificationRecord`

### Audit Event
**Meaning:** A logged governance action — admission, restriction, escalation, access grant/revoke.
**Lifecycle:** Occurred → Logged → Auditable
**Create:** System. **View:** Admin only. **Modify:** None (immutable).
**Current model:** `SystemAuditLog`, `DiagnosticAuditEvent`, `AuditEvent`
