import type {
  ReturnBriefComposerSource,
  ReturnBriefV1,
} from "./return-brief-contract";

const BOUNDARY_NOTE =
  "This is a client-safe continuation of the governed record. It does not expose respondent text, operator notes, raw evidence, suppression details, or internal trigger mechanics.";

export function composeReturnBriefV1(
  source: ReturnBriefComposerSource | null,
  caseRef: string,
): ReturnBriefV1 {
  if (!source) {
    return {
      caseRef,
      status: "INSUFFICIENT_EVIDENCE",
      originalCondition: null,
      originalCommitment: null,
      elapsedTimeLabel: null,
      whatChanged: [],
      whatDidNotChange: [
        "The governed record does not yet contain enough return-cycle evidence to reopen the condition safely.",
      ],
      nowRequired: [
        "Continue the case in Decision Centre until the record contains a completed or missed commitment, review trigger, or equivalent return-cycle evidence.",
      ],
      escalationStatus: "NOT_EARNED",
      decisionCentreHref: "/decision-centre",
      provenanceStatus: "UNAVAILABLE",
      boundaryNote: BOUNDARY_NOTE,
    };
  }

  const whatChanged = buildWhatChanged(source);
  const whatDidNotChange = buildWhatDidNotChange(source);
  const nowRequired = compact([
    source.challenge,
  ]);

  return {
    caseRef,
    status: deriveStatus(source),
    originalCondition: clean(source.contradiction?.constraint),
    originalCommitment: clean(source.verification?.[0]?.label),
    elapsedTimeLabel: buildElapsedTimeLabel(source.costOfInaction?.daysElapsed),
    whatChanged,
    whatDidNotChange,
    nowRequired: nowRequired.length > 0
      ? nowRequired
      : ["The next required move is not yet available from the current record."],
    escalationStatus: deriveEscalationStatus(source.trigger),
    decisionCentreHref: "/decision-centre",
    provenanceStatus: "UNAVAILABLE",
    boundaryNote: BOUNDARY_NOTE,
  };
}

function deriveStatus(source: ReturnBriefComposerSource): ReturnBriefV1["status"] {
  const verificationStates = source.verification?.map((item) => item.status) ?? [];
  const hasUnresolvedVerification = verificationStates.some((status) =>
    status === "DUE" ||
    status === "OVERDUE" ||
    status === "VERIFIED_BLOCKED" ||
    status === "UNVERIFIED",
  );

  if (
    source.contradiction ||
    source.trajectory?.state === "FRAGILE" ||
    source.trajectory?.state === "DETERIORATING" ||
    hasUnresolvedVerification
  ) {
    return "ACTIVE";
  }

  if (
    source.trajectory?.state === "ASCENDING" &&
    verificationStates.length > 0 &&
    verificationStates.every((status) => status === "VERIFIED_EXECUTED")
  ) {
    return "RESOLVED";
  }

  return "UNKNOWN";
}

function deriveEscalationStatus(
  trigger: ReturnBriefComposerSource["trigger"],
): ReturnBriefV1["escalationStatus"] {
  switch (trigger) {
    case "contradiction_persistence":
      return "EARNED";
    case "deteriorating_trajectory":
      return "RECOMMENDED";
    case "fragile_trajectory":
    case "no_activity_after_commitment":
    case "recurrence_detected":
      return "NOT_EARNED";
    default:
      return "UNKNOWN";
  }
}

function buildWhatChanged(source: ReturnBriefComposerSource): string[] {
  const items: string[] = [];
  if (source.delta?.clarity && source.delta.clarity !== "unchanged") {
    items.push(`Clarity ${source.delta.clarity}.`);
  }
  if (source.delta?.authority && source.delta.authority !== "unchanged") {
    items.push(`Authority ${source.delta.authority}.`);
  }
  if (source.delta?.readiness && source.delta.readiness !== "unchanged") {
    items.push(`Readiness ${source.delta.readiness}.`);
  }

  for (const verification of source.verification ?? []) {
    if (!verification?.label || !verification?.status) continue;
    if (verification.status === "VERIFIED_EXECUTED") {
      items.push(`${verification.label} was completed.`);
    } else if (verification.status === "VERIFIED_BLOCKED") {
      items.push(`${verification.label} was recorded as blocked.`);
    }
  }

  return compact(items);
}

function buildWhatDidNotChange(source: ReturnBriefComposerSource): string[] {
  const items: string[] = [];
  if (source.contradiction?.status) {
    items.push(source.contradiction.status);
  }

  for (const verification of source.verification ?? []) {
    if (!verification?.label || !verification?.status) continue;
    if (
      verification.status === "DUE" ||
      verification.status === "OVERDUE" ||
      verification.status === "UNVERIFIED"
    ) {
      items.push(`${verification.label} remains ${verification.status.toLowerCase().replace(/_/g, " ")}.`);
    }
  }

  if (items.length === 0 && source.trajectory?.reason) {
    items.push(source.trajectory.reason);
  }

  return compact(items);
}

function buildElapsedTimeLabel(daysElapsed?: number | null): string | null {
  if (typeof daysElapsed !== "number" || !Number.isFinite(daysElapsed)) return null;
  if (daysElapsed <= 0) return "Recorded today";
  return `${daysElapsed} day${daysElapsed === 1 ? "" : "s"} since the recorded condition entered this cycle`;
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed : null;
}

function compact(values: Array<string | null | undefined>): string[] {
  return values
    .map((value) => clean(value))
    .filter((value): value is string => Boolean(value));
}
