export interface BoardroomIntakeContract {
  decisionBeingReviewed: string;
  commercialContext: string;
  currentConstraint: string;
  desiredOutcome: string;
  availableEvidence: string[];
  urgencyOrDeadline: string;
  stakeholders: string[];
  optionsAlreadyConsidered: string[];
  whatHasAlreadyBeenTried: string;
  consequenceOfDelay: string;
  definitionOfSuccess: string;
}

export const BOARDROOM_REQUIRED_INTAKE_FIELDS = [
  "decisionBeingReviewed",
  "commercialContext",
  "currentConstraint",
  "desiredOutcome",
  "availableEvidence",
  "urgencyOrDeadline",
  "stakeholders",
  "optionsAlreadyConsidered",
  "whatHasAlreadyBeenTried",
  "consequenceOfDelay",
  "definitionOfSuccess",
] as const;

export function isBoardroomIntakeComplete(intake: Partial<BoardroomIntakeContract>): intake is BoardroomIntakeContract {
  return BOARDROOM_REQUIRED_INTAKE_FIELDS.every((field) => {
    const value = intake[field];
    return Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim().length > 0;
  });
}
