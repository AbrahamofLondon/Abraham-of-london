# Retainer Readiness Final Verification

Route verified: `/oversight`

## A2. Build toward enforced cadence, not manual disclaimer

Current state:
Retainer cadence may still be manual or operator-confirmed today. Do not falsely describe it as automated, continuous, or always-on unless the runtime actually enforces it.

But the implementation target is not “manual honesty.” The target is to remove the blocker preventing £50k readiness.

Required direction:
Build the cadence layer so retained oversight becomes enforceable, scheduled, auditable, and buyer-visible.

Required capabilities:

1. Cadence contract
   - Define retained cadence states:
     - `NOT_CONFIGURED`
     - `MANUAL_OPERATOR_REVIEW`
     - `SCHEDULED`
     - `OVERDUE`
     - `COMPLETED`
     - `SKIPPED_WITH_REASON`
     - `ESCALATED`
   - Each state must have public-safe language and operator-only detail.

2. Scheduled review record
   - Persist a retained oversight cycle record with:
     - `accountId` / `organisationId`
     - `cycleId`
     - `cadenceType`
     - `scheduledFor`
     - `completedAt`
     - `skippedAt`
     - `skippedReason`
     - `escalationReason`
     - `operatorId` if available
     - `source: manual | scheduled | system_triggered`
     - `evidencePosture`

3. Buyer-visible cadence posture
   - `/oversight` must show:
     - next scheduled review
     - last completed review
     - overdue review warning
     - whether cadence is manual, scheduled, or not configured
   - If cadence is manual, say:
     `Retained review is operator-confirmed. Automated scheduling is not yet active for this account.`
   - If scheduled, say:
     `Next retained review is scheduled for [date].`
   - If overdue, say:
     `A retained review is overdue. Operator attention is required.`

4. Operator enforcement surface
   - Add or extend an operator/admin view showing:
     - due cycles
     - overdue cycles
     - skipped cycles
     - escalation-required cycles
   - This does not need full automation yet, but it must create operational enforceability.

5. Escalation rule
   - If a retained cycle becomes overdue, create or expose a signal:
     `RETAINED_REVIEW_OVERDUE`
   - This signal must be available to Oversight Brief / operator review / command summary.
   - Do not expose trigger thresholds publicly.

6. Future automation compatibility
   - The implementation must be compatible with external scheduler integration later.
   - Do not hard-code cadence as static copy.
   - Do not make cadence purely visual.
   - Cadence must be represented as state.

Forbidden public claims until scheduler enforcement is active:

- `Automated oversight is active`
- `Continuous monitoring`
- `Always-on governance`
- `Autonomous retained oversight`
- `Automatically reviewed every month`

Allowed public claims after this pass if implemented:

- `Retained oversight cadence is configured.`
- `Next review is scheduled.`
- `This cycle is overdue.`
- `Operator review is required.`
- `Oversight continuity is being tracked.`
- `A missed retained review is recorded as a governance event.`

Target outcome:
Move cadence from a £50k blocker to a partially closed readiness pillar.

Classification after implementation:

- If only manual cadence is visible: `FOUNDATION_READY`
- If scheduled cycles are persisted and shown: `NEAR_DEFENSIBLE`
- If overdue cycles create retained oversight signals: `DEFENSIBLE`
- If external automation runs without operator initiation: `£50K_READY_CADENCE`

## Sponsor-safe verification

- no raw respondent text shown
- no operator notes shown
- no counsel notes shown
- no thresholds shown
- no trigger mechanics shown
- no internal engine naming shown
- cadence language is manual and explicit
- cancellation-loss language distinguishes active oversight loss from data deletion

| Capability | Buyer-visible? | Sponsor-safe? | Operator-safe? | Status | Remaining gap |
| --- | --- | --- | --- | --- | --- |
| Oversight status | Yes | Yes | Yes | `PASS` | No hard entitlement banner yet beyond authenticated/account context |
| Retained evidence counts | Yes | Yes | Yes | `PASS` | Counts are stronger than explanations in thin states |
| Cadence posture | Yes | Yes | Yes | `PASS` | Mostly manual, not automated |
| Counsel history | Yes | Yes | Yes | `PASS` | Role model behind the scenes is still partly env-driven |
| Boardroom archive | Yes | Yes | Yes | `PASS` | Organisation-scoped archive depth still depends on source evidence |
| Cancellation-loss visibility | Yes | Yes | Yes | `PASS` | More powerful once more cycles accumulate |
| Portfolio memory | No | N/A | Partial | `INTENTIONALLY_WITHHELD` | Entitlement and suppression maturity still required |
