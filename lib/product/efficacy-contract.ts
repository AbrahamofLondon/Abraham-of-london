/**
 * lib/product/efficacy-contract.ts
 *
 * The efficacy contract defines what every product surface must produce
 * to prove it changed what the user does next.
 *
 * A surface is not efficacious unless it produces at least one of:
 * a committed action, a refused action, a named blocker, a verified outcome,
 * a changed priority, a recorded contradiction, a triggered escalation,
 * a scheduled checkpoint, a measurable cost movement, or a decision credit movement.
 *
 * Anything else is commentary.
 */

export type EfficacySurface =
  | "FAST_DIAGNOSTIC"
  | "PURPOSE_ALIGNMENT"
  | "CONSTITUTIONAL_DIAGNOSTIC"
  | "TEAM_ASSESSMENT"
  | "ENTERPRISE_ASSESSMENT"
  | "EXECUTIVE_REPORTING"
  | "STRATEGY_ROOM"
  | "RETURN_BRIEF"
  | "DECISION_CENTRE"
  | "OVERSIGHT_BRIEF"
  | "COUNSEL_REVIEW"
  | "BOARDROOM_MODE";

export type EfficacyActionType =
  | "CLARIFY_OWNER"
  | "NAME_DECISION"
  | "STOP_ACTION"
  | "START_ACTION"
  | "VERIFY_COMMITMENT"
  | "REPORT_BLOCKER"
  | "ESCALATE_COUNSEL"
  | "ESCALATE_BOARDROOM"
  | "INVITE_RESPONDENTS"
  | "GENERATE_REPORT"
  | "ENTER_STRATEGY_ROOM"
  | "SCHEDULE_CHECKPOINT"
  | "REVIEW_RETURN_BRIEF"
  | "APPROVE_OVERSIGHT_ACTION"
  | "CHALLENGE_PRIORITY"
  | "ACCEPT_PRIORITY"
  | "CONFIRM_COMPLETION"
  | "REMOVE_COMPETING_OBLIGATION"
  | "TEST_WEAKEST_DOMAIN";

export type EfficacyEvidencePosture =
  | "USER_REPORTED"
  | "SYSTEM_INFERRED"
  | "AGGREGATED"
  | "OPERATOR_REVIEWED"
  | "OUTCOME_VERIFIED"
  | "SUPPRESSED";

export type CheckpointType =
  | "48_HOUR_ACTION"
  | "7_DAY_BLOCKER"
  | "14_DAY_OUTCOME"
  | "30_DAY_PERSISTENCE"
  | "60_DAY_RECURRENCE";

export type CheckpointResponseType =
  | "YES_NO"
  | "TEXT"
  | "EVIDENCE_NOTE"
  | "BLOCKER_REPORT"
  | "STATUS_SELECT";

export type CheckpointResponseStatus =
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "BLOCKED"
  | "ABANDONED"
  | "NO_LONGER_RELEVANT"
  | "DISPUTED_FINDING"
  | "NOT_RESPONDED";

export type EfficacyCommand = {
  id: string;
  surface: EfficacySurface;
  actionType: EfficacyActionType;
  title: string;
  instruction: string;
  whyThisMatters: string;
  sourceEvidence: Array<{
    label: string;
    sourceSurface: EfficacySurface;
    capturedAt?: string;
    posture: EfficacyEvidencePosture;
  }>;
  checkpoint?: {
    type: CheckpointType;
    dueAt: string;
    verificationQuestion: string;
    requiredResponseType: CheckpointResponseType;
  };
  escalationIfIgnored?: {
    trigger: string;
    consequence: string;
  };
  clientSafe: boolean;
};

export type EfficacyOutcome = {
  commandId: string;
  surface: EfficacySurface;
  responseStatus: CheckpointResponseStatus;
  respondedAt: string;
  evidenceNote?: string;
  blockerDescription?: string;
  whatChanged?: string;
  whatShouldSystemRemember?: string;
  classification:
    | "ACTION_CONFIRMED"
    | "ACTION_BLOCKED"
    | "ACTION_ABANDONED"
    | "OUTCOME_IMPROVED"
    | "OUTCOME_UNCHANGED"
    | "OUTCOME_DETERIORATED"
    | "SYSTEM_FINDING_DISPUTED"
    | "INSUFFICIENT_EVIDENCE";
};

// ─── COMMAND BUILDERS PER SURFACE ────────────────────────────────────────────

function makeId(surface: string, action: string): string {
  return `${surface.toLowerCase()}_${action.toLowerCase()}_${Date.now().toString(36)}`;
}

function addDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

export function buildFastDiagnosticCommand(input: {
  decisionText: string;
  ownerText: string;
  consequenceText: string;
  committed: boolean;
}): EfficacyCommand {
  const ownerClear = input.ownerText.length > 3 && !/(everyone|the team|shared|unclear)/i.test(input.ownerText);

  if (!ownerClear) {
    return {
      id: makeId("FAST", "CLARIFY_OWNER"),
      surface: "FAST_DIAGNOSTIC",
      actionType: "CLARIFY_OWNER",
      title: "Clarify who owns this decision",
      instruction: `You named the decision: "${input.decisionText.slice(0, 120)}". But the owner is unclear. Before another meeting happens, name the one person who can make this binding.`,
      whyThisMatters: "Decisions without owners do not get made. They get discussed.",
      sourceEvidence: [{
        label: "Fast Diagnostic: authority signal",
        sourceSurface: "FAST_DIAGNOSTIC",
        posture: "USER_REPORTED",
      }],
      checkpoint: {
        type: "48_HOUR_ACTION",
        dueAt: addDays(2),
        verificationQuestion: "Have you identified and contacted the decision owner?",
        requiredResponseType: "YES_NO",
      },
      escalationIfIgnored: {
        trigger: "No response within 48 hours",
        consequence: "The system will flag this as an ownership vacuum in the Return Brief.",
      },
      clientSafe: true,
    };
  }

  return {
    id: makeId("FAST", "NAME_DECISION"),
    surface: "FAST_DIAGNOSTIC",
    actionType: input.committed ? "START_ACTION" : "NAME_DECISION",
    title: input.committed
      ? "Act on the identified blocker within 48 hours"
      : "Name the first irreversible consequence of doing nothing",
    instruction: input.committed
      ? `You committed to act. The decision is "${input.decisionText.slice(0, 120)}". The consequence of delay is "${input.consequenceText.slice(0, 120)}". Execute the first corrective move before the checkpoint.`
      : `You identified the decision but did not commit to act. Name the first consequence that becomes irreversible if this stays unresolved for 30 more days.`,
    whyThisMatters: input.committed
      ? "Commitment without execution is the most common pattern the system detects."
      : "Naming the irreversible consequence is what separates thinking from deciding.",
    sourceEvidence: [{
      label: "Fast Diagnostic: decision + consequence",
      sourceSurface: "FAST_DIAGNOSTIC",
      posture: "USER_REPORTED",
    }],
    checkpoint: {
      type: "48_HOUR_ACTION",
      dueAt: addDays(2),
      verificationQuestion: input.committed
        ? "Did you execute the first corrective move?"
        : "Have you named the irreversible consequence?",
      requiredResponseType: input.committed ? "STATUS_SELECT" : "TEXT",
    },
    escalationIfIgnored: {
      trigger: "No response within 48 hours",
      consequence: "The system will record this as unverified commitment in the decision spine.",
    },
    clientSafe: true,
  };
}

export function buildExecutiveReportingCommand(input: {
  topPriority: string;
  decisionText: string;
  constraintText: string;
  hasVerificationCriteria: boolean;
}): EfficacyCommand {
  return {
    id: makeId("ER", "ACCEPT_PRIORITY"),
    surface: "EXECUTIVE_REPORTING",
    actionType: "ACCEPT_PRIORITY",
    title: "Accept or challenge the governed priority stack",
    instruction: `The system has identified "${input.topPriority.slice(0, 150)}" as the priority intervention. Accept this priority and proceed to execution, or challenge it with evidence. Silence is not an option — the system will treat non-response as acceptance.`,
    whyThisMatters: `The decision "${input.decisionText.slice(0, 100)}" is constrained by "${input.constraintText.slice(0, 100)}". Without priority acceptance, execution cannot begin governed.`,
    sourceEvidence: [{
      label: "Executive Reporting: priority stack",
      sourceSurface: "EXECUTIVE_REPORTING",
      posture: "SYSTEM_INFERRED",
    }],
    checkpoint: {
      type: "7_DAY_BLOCKER",
      dueAt: addDays(7),
      verificationQuestion: "Have you accepted, challenged, or escalated the priority stack?",
      requiredResponseType: "STATUS_SELECT",
    },
    escalationIfIgnored: {
      trigger: "No priority decision within 7 days",
      consequence: "The system will treat this as implicit acceptance and proceed to checkpoint verification.",
    },
    clientSafe: true,
  };
}

export function buildStrategyRoomCommand(input: {
  sessionStatus: string;
  pendingDecisions: number;
  blockedDecisions: number;
  executedDecisions: number;
}): EfficacyCommand {
  const totalDecisions = input.pendingDecisions + input.blockedDecisions + input.executedDecisions;

  if (totalDecisions === 0) {
    return {
      id: makeId("SR", "START_ACTION"),
      surface: "STRATEGY_ROOM",
      actionType: "START_ACTION",
      title: "Record the first governed move",
      instruction: "This case has entered Strategy Room without a recorded execution move. Name the first governed action now so the system can track whether execution actually starts.",
      whyThisMatters: "The Strategy Room cannot govern theory. It can only govern named moves, owners, and outcomes.",
      sourceEvidence: [{
        label: "Strategy Room: entry state",
        sourceSurface: "STRATEGY_ROOM",
        posture: "SYSTEM_INFERRED",
      }],
      checkpoint: {
        type: "48_HOUR_ACTION",
        dueAt: addDays(2),
        verificationQuestion: "Have you recorded and initiated the first governed move?",
        requiredResponseType: "STATUS_SELECT",
      },
      clientSafe: true,
    };
  }

  if (input.blockedDecisions > 0) {
    return {
      id: makeId("SR", "REPORT_BLOCKER"),
      surface: "STRATEGY_ROOM",
      actionType: "REPORT_BLOCKER",
      title: "Name and resolve the active blocker",
      instruction: `${input.blockedDecisions} decision${input.blockedDecisions === 1 ? " is" : "s are"} currently blocked. Name the structural cause of the blockage and determine whether it requires authority escalation, resource reallocation, or counsel review.`,
      whyThisMatters: "Blocked decisions compound cost. Every day of blockage reduces the option set.",
      sourceEvidence: [{
        label: "Strategy Room: execution state",
        sourceSurface: "STRATEGY_ROOM",
        posture: "SYSTEM_INFERRED",
      }],
      checkpoint: {
        type: "48_HOUR_ACTION",
        dueAt: addDays(2),
        verificationQuestion: "Has the blocker been resolved or escalated?",
        requiredResponseType: "STATUS_SELECT",
      },
      clientSafe: true,
    };
  }

  if (input.pendingDecisions > 0) {
    return {
      id: makeId("SR", "VERIFY_COMMITMENT"),
      surface: "STRATEGY_ROOM",
      actionType: "VERIFY_COMMITMENT",
      title: "Confirm execution of pending decisions",
      instruction: `${input.pendingDecisions} decision${input.pendingDecisions === 1 ? "" : "s"} pending execution. Record whether each was executed, blocked, or abandoned.`,
      whyThisMatters: "Unrecorded execution is invisible to the governance system. The system cannot verify what it cannot see.",
      sourceEvidence: [{
        label: "Strategy Room: decision log",
        sourceSurface: "STRATEGY_ROOM",
        posture: "SYSTEM_INFERRED",
      }],
      checkpoint: {
        type: "7_DAY_BLOCKER",
        dueAt: addDays(7),
        verificationQuestion: "Have all pending decisions been recorded as executed, blocked, or abandoned?",
        requiredResponseType: "STATUS_SELECT",
      },
      clientSafe: true,
    };
  }

  return {
    id: makeId("SR", "SCHEDULE_CHECKPOINT"),
    surface: "STRATEGY_ROOM",
    actionType: "SCHEDULE_CHECKPOINT",
    title: "Schedule the next verification checkpoint",
    instruction: `All current decisions have been addressed. Schedule the next outcome verification to confirm whether the structural condition has changed.`,
    whyThisMatters: "Execution without verification is hope, not governance.",
    sourceEvidence: [{
      label: "Strategy Room: session state",
      sourceSurface: "STRATEGY_ROOM",
      posture: "SYSTEM_INFERRED",
    }],
    checkpoint: {
      type: "14_DAY_OUTCOME",
      dueAt: addDays(14),
      verificationQuestion: "Has the structural condition changed since execution?",
      requiredResponseType: "TEXT",
    },
    clientSafe: true,
  };
}

export function buildReturnBriefCommand(input: {
  trigger: string;
  hasUnverifiedCommitment: boolean;
  trajectory: string;
}): EfficacyCommand {
  return {
    id: makeId("RB", "CONFIRM_COMPLETION"),
    surface: "RETURN_BRIEF",
    actionType: "CONFIRM_COMPLETION",
    title: "Confirm whether the committed action was completed, blocked, or abandoned",
    instruction: input.hasUnverifiedCommitment
      ? "You made a commitment that has not been verified. The system needs your confirmation: completed, blocked, abandoned, or still in progress."
      : `The return brief was triggered by: ${input.trigger.replace(/_/g, " ")}. Confirm what has changed since the last session.`,
    whyThisMatters: input.trajectory === "DETERIORATING"
      ? "The trajectory is worsening. Without your confirmation, the system cannot distinguish inaction from blocked execution."
      : "The system records what happened, not what was intended. Your confirmation creates the evidence record.",
    sourceEvidence: [{
      label: "Return Brief: trajectory + commitment state",
      sourceSurface: "RETURN_BRIEF",
      posture: "SYSTEM_INFERRED",
    }],
    checkpoint: {
      type: "48_HOUR_ACTION",
      dueAt: addDays(2),
      verificationQuestion: "What is the current status of your committed action?",
      requiredResponseType: "STATUS_SELECT",
    },
    escalationIfIgnored: {
      trigger: "No response within 48 hours",
      consequence: "The system will classify this as unverified and flag it in the next oversight cycle.",
    },
    clientSafe: true,
  };
}

export function buildDecisionCentreCommand(input: {
  topCaseId: string;
  topCaseTitle: string;
  topCaseReason: string;
}): EfficacyCommand {
  return {
    id: makeId("DC", "START_ACTION"),
    surface: "DECISION_CENTRE",
    actionType: "START_ACTION",
    title: `Act on this case first: ${input.topCaseTitle.slice(0, 80)}`,
    instruction: `This case is the current priority because: ${input.topCaseReason}. Open the case, confirm the required action, and record your response.`,
    whyThisMatters: "Prioritisation without action is triage theatre. The system ranks cases so you act on the most consequential one first.",
    sourceEvidence: [{
      label: "Decision Centre: case priority",
      sourceSurface: "DECISION_CENTRE",
      posture: "SYSTEM_INFERRED",
    }],
    clientSafe: true,
  };
}
