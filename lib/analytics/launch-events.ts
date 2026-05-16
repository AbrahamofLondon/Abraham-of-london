/**
 * launch-events.ts — Typed launch instrumentation event definitions.
 *
 * Strict rule: no raw user evidence text, decision text, blocker text,
 * counsel text, outcome text, respondent text, or freeform notes may
 * appear in any launch event payload.
 */

// ─── Event names ────────────────────────────────────────────────────────────

export type LaunchEventName =
  | "homepage_cta_clicked"
  | "fast_started"
  | "fast_completed"
  | "checkpoint_created"
  | "checkpoint_responded"
  | "earned_step_shown"
  | "earned_step_clicked"
  | "decision_centre_opened"
  | "return_brief_opened"
  | "return_brief_response_submitted"
  | "purpose_alignment_started"
  | "purpose_alignment_completed"
  | "executive_reporting_gate_viewed"
  | "executive_reporting_started"
  | "strategy_room_entered"
  | "strategy_room_decision_recorded"
  | "counsel_room_viewed"
  | "counsel_intake_started"
  | "counsel_intake_submitted"
  // ── Adoption instrumentation ──
  | "calculator_completed"
  | "save_case_clicked"
  | "account_continuity_started"
  | "board_summary_printed"
  | "executive_reporting_clicked"
  | "strategy_room_admission_attempted"
  | "strategy_room_payment_clicked"
  | "return_brief_viewed"
  | "return_brief_generated"
  | "provenance_sample_viewed"
  | "anchor_log_viewed"
  | "proof_pack_viewed"
  | "case_saved"
  | "send_to_self_clicked"
  | "diagnostic_completed"
  | "save_case_prompt_seen"
  | "account_created_from_save"
  | "provenance_demo_verified"
  // ── Commercial instrumentation ──
  | "upgrade_prompt_seen"
  | "trial_started"
  | "trial_expired"
  | "trial_converted"
  | "trial_declined"
  | "free_limit_reached"
  | "case_archived_after_trial"
  | "professional_upgrade_clicked"
  | "pricing_viewed_from_prompt";

// ─── Event payload ──────────────────────────────────────────────────────────

export interface LaunchEventPayload {
  eventName: LaunchEventName;
  surface: string;
  caseId?: string | null;
  journeyId?: string | null;
  sessionId?: string | null;
  checkpointId?: string | null;
  admissionState?: string | null;
  evidencePosture?: string | null;
  sourceSurface?: string | null;
  productCode?: string | null;
  route?: string | null;
  actionType?: string | null;
  timestamp: string;
  userEmailHash?: string | null;
}

// ─── Blocked fields (server-side validation) ────────────────────────────────

export const BLOCKED_PAYLOAD_FIELDS = [
  "decisionText",
  "evidenceText",
  "blockerDescription",
  "counselText",
  "notes",
  "message",
  "freeform",
  "respondentText",
  "rawText",
  "userInput",
] as const;

/**
 * Returns true if the payload contains any blocked raw-text field.
 */
export function containsBlockedField(obj: Record<string, unknown>): boolean {
  for (const key of BLOCKED_PAYLOAD_FIELDS) {
    if (key in obj && obj[key] != null && obj[key] !== "") return true;
  }
  return false;
}
