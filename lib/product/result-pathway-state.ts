import type { AssessmentKind, AssessmentResult, EarnedRoute } from "@/lib/diagnostics/assessment-result-contract";

export type ResultPathwaySurface =
  | "decision_delay"
  | "fast_diagnostic"
  | "purpose_alignment"
  | "constitutional"
  | "team"
  | "enterprise"
  | "board_summary";

export type ResultPathwayPersistence =
  | "session_only"
  | "saved_case"
  | "account_bound"
  | "live_governed_record";

export type ResultPathwayUserState =
  | "anonymous"
  | "authenticated_free"
  | "trial"
  | "professional"
  | "enterprise";

export type ResultPathwayEvidenceState =
  | "insufficient"
  | "basic"
  | "strong"
  | "intervention_ready"
  | "oversight_ready";

export type ResultPathwayCommercialState =
  | "free"
  | "professional_recommended"
  | "professional_required"
  | "paid_report_eligible"
  | "strategy_room_eligible"
  | "contracted_only";

export type ResultPathwayActionType =
  | "save_case"
  | "open_decision_centre"
  | "start_trial"
  | "upgrade"
  | "generate_report"
  | "enter_strategy_room"
  | "request_return_brief"
  | "continue_assessment"
  | "send_to_self";

export type ResultPathwayAction = {
  label: string;
  href?: string;
  actionType: ResultPathwayActionType;
  reason: string;
};

export type ResultPathwayState = {
  surface: ResultPathwaySurface;
  persistence: ResultPathwayPersistence;
  userState: ResultPathwayUserState;
  evidenceState: ResultPathwayEvidenceState;
  commercialState: ResultPathwayCommercialState;
  primaryAction: ResultPathwayAction;
  secondaryActions: Array<{
    label: string;
    href?: string;
    actionType: string;
    reason?: string;
  }>;
  boundaryNote: string;
};

export type ResultPathwayInput = {
  surface: ResultPathwaySurface;
  persistence: ResultPathwayPersistence;
  userState: ResultPathwayUserState;
  evidenceState: ResultPathwayEvidenceState;
  caseId?: string | null;
  freeActiveCaseLimitReached?: boolean;
  earnedRoute?: {
    route: EarnedRoute;
    label: string;
    href: string;
    reason: string;
  } | null;
};

export function deriveResultPathwayState(input: ResultPathwayInput): ResultPathwayState {
  const commercialState = deriveCommercialState(input);
  const primaryAction = derivePrimaryAction(input, commercialState);
  const secondaryActions = deriveSecondaryActions(input, primaryAction);

  return {
    surface: input.surface,
    persistence: input.persistence,
    userState: input.userState,
    evidenceState: input.evidenceState,
    commercialState,
    primaryAction,
    secondaryActions: secondaryActions.slice(0, 2),
    boundaryNote: deriveBoundaryNote(input),
  };
}

export function surfaceFromAssessmentKind(kind: AssessmentKind): ResultPathwaySurface {
  switch (kind) {
    case "FAST_DIAGNOSTIC":
      return "fast_diagnostic";
    case "PURPOSE_ALIGNMENT":
      return "purpose_alignment";
    case "CONSTITUTIONAL_DIAGNOSTIC":
      return "constitutional";
    case "TEAM_ASSESSMENT":
      return "team";
    case "ENTERPRISE_ASSESSMENT":
      return "enterprise";
  }
}

export function evidenceStateFromAssessmentResult(
  result: Pick<AssessmentResult, "earnedRoute" | "evidencePosture" | "band">,
): ResultPathwayEvidenceState {
  if (result.earnedRoute.route === "RETAINER_OVERSIGHT") return "oversight_ready";
  if (result.earnedRoute.route === "STRATEGY_ROOM" || result.earnedRoute.route === "BOARDROOM") {
    return "intervention_ready";
  }
  if (result.earnedRoute.route === "EXECUTIVE_REPORTING") return "strong";
  if (result.evidencePosture === "OPERATOR_VERIFIED" || result.evidencePosture === "THIRD_PARTY") {
    return "strong";
  }
  if (result.band === "WATCH") return "basic";
  return "basic";
}

function deriveCommercialState(input: ResultPathwayInput): ResultPathwayCommercialState {
  if (
    input.freeActiveCaseLimitReached &&
    input.persistence === "session_only" &&
    (input.userState === "anonymous" || input.userState === "authenticated_free")
  ) {
    return "professional_required";
  }
  if (input.evidenceState === "oversight_ready") return "contracted_only";
  if (input.evidenceState === "intervention_ready") return "strategy_room_eligible";
  if (input.evidenceState === "strong") return "paid_report_eligible";
  if (
    input.persistence !== "session_only" &&
    (input.userState === "anonymous" || input.userState === "authenticated_free")
  ) {
    return "professional_recommended";
  }
  return "free";
}

function derivePrimaryAction(
  input: ResultPathwayInput,
  commercialState: ResultPathwayCommercialState,
): ResultPathwayAction {
  if (
    commercialState === "professional_required" &&
    input.persistence === "session_only"
  ) {
    return {
      label: "Start Professional trial",
      actionType: "start_trial",
      reason:
        "The free active-case limit is already reached. Professional preserves continuity so this reading can become a live governed case.",
    };
  }

  if (input.persistence === "session_only") {
    return {
      label:
        input.userState === "anonymous"
          ? "Create free account and save this case"
          : "Save this case to Decision Centre",
      actionType: "save_case",
      reason:
        "A session-only reading does not survive across devices or create a durable governed case until it is saved.",
    };
  }

  return {
    label: "Open in Decision Centre",
    href: input.caseId
      ? `/decision-centre/case/${encodeURIComponent(input.caseId)}`
      : "/decision-centre",
    actionType: "open_decision_centre",
    reason:
      "The governed case already exists. Continue in Decision Centre to preserve timeline, verification, and next-action continuity.",
  };
}

function deriveSecondaryActions(
  input: ResultPathwayInput,
  primaryAction: ResultPathwayAction,
): ResultPathwayState["secondaryActions"] {
  const actions: ResultPathwayState["secondaryActions"] = [];

  if (input.surface === "board_summary") {
    actions.push({
      label: "Send preview to self",
      actionType: "send_to_self",
      reason: "Sends a copy of the preview only; it does not create a governed record.",
    });
  } else if (input.persistence === "session_only") {
    actions.push({
      label: "Send result to self",
      actionType: "send_to_self",
      reason: "Sends a copy only; it does not create a governed record.",
    });
  }

  const earnedAction = earnedRouteToSecondaryAction(input.earnedRoute);
  if (earnedAction && earnedAction.actionType !== primaryAction.actionType) {
    actions.push(earnedAction);
  }

  if (input.surface === "decision_delay" && actions.length < 2) {
    actions.push({
      label: "Run Fast Diagnostic",
      href: "/diagnostics/fast",
      actionType: "continue_assessment",
      reason: "The estimate is scenario-only. The Fast Diagnostic turns one live decision into a governed reading.",
    });
  }

  return actions;
}

function earnedRouteToSecondaryAction(
  earnedRoute: ResultPathwayInput["earnedRoute"],
): ResultPathwayState["secondaryActions"][number] | null {
  if (!earnedRoute) return null;

  switch (earnedRoute.route) {
    case "EXECUTIVE_REPORTING":
      return {
        label: earnedRoute.label,
        href: earnedRoute.href,
        actionType: "generate_report",
        reason: `Evidence-gated paid intelligence layer. ${earnedRoute.reason}`,
      };
    case "STRATEGY_ROOM":
    case "BOARDROOM":
      return {
        label: earnedRoute.label,
        href: earnedRoute.href,
        actionType: "enter_strategy_room",
        reason: `Earned intervention layer. ${earnedRoute.reason}`,
      };
    case "NEXT_ASSESSMENT":
      return {
        label: earnedRoute.label,
        href: earnedRoute.href,
        actionType: "continue_assessment",
        reason: earnedRoute.reason,
      };
    case "WATCH":
    case "DECISION_CENTRE":
    case "COUNSEL_REVIEW":
    case "RETAINER_OVERSIGHT":
      return null;
  }
}

function deriveBoundaryNote(input: ResultPathwayInput): string {
  if (input.surface === "board_summary") {
    return "This is a board-ready preview generated from available diagnostic evidence. It does not create a new governed record.";
  }

  if (input.surface === "decision_delay") {
    return "No governed record exists until this decision-delay estimate is saved as a governed case.";
  }

  if (input.persistence === "session_only") {
    return "Current state: session-only reading. This result will not survive across devices until saved as a governed case.";
  }

  return "Current state: governed case saved. Continue in Decision Centre to preserve timeline, verification, and Return Brief eligibility.";
}
