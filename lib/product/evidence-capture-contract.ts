export type AssessmentEvidenceCapture = {
  priorAttempts?: string;
  failureCause?: string;
  recurrenceSignal?: string;
  verificationCriteria?: string;
  stopSignal?: string;
  escalationTrigger?: string;
  decisionDependency?: string;
  consequenceFinancial?: string;
  consequenceReputational?: string;
  consequenceInstitutional?: string;
  consequenceTimeline?: string;
};

export type AssessmentEvidenceCaptureField = keyof AssessmentEvidenceCapture;

const UNSAFE_EVIDENCE_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b(harass|harassment|discriminat|racist|sexist|abuse|abusive|fraud|theft|stole|illegal|misconduct|disciplinary|allegation)\b/i,
] as const;

export function sanitizeAssessmentEvidenceCapture(
  input: AssessmentEvidenceCapture | null | undefined,
): AssessmentEvidenceCapture {
  const sanitized: AssessmentEvidenceCapture = {};

  if (!input) {
    return sanitized;
  }

  const entries = Object.entries(input) as Array<
    [AssessmentEvidenceCaptureField, string | undefined]
  >;

  for (const [key, value] of entries) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed) {
      sanitized[key] = trimmed;
    }
  }

  return sanitized;
}

export function missingAssessmentEvidenceCaptureFields(
  input: AssessmentEvidenceCapture | null | undefined,
  requiredFields: AssessmentEvidenceCaptureField[],
): AssessmentEvidenceCaptureField[] {
  const sanitized = sanitizeAssessmentEvidenceCapture(input);

  return requiredFields.filter((field) => !sanitized[field]);
}

export function hasRequiredAssessmentEvidenceCaptureFields(
  input: AssessmentEvidenceCapture | null | undefined,
  requiredFields: AssessmentEvidenceCaptureField[],
): boolean {
  return missingAssessmentEvidenceCaptureFields(input, requiredFields).length === 0;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function mergeAssessmentEvidenceCapture(
  ...inputs: Array<AssessmentEvidenceCapture | null | undefined>
): AssessmentEvidenceCapture {
  const merged: AssessmentEvidenceCapture = {};

  for (const input of inputs) {
    const sanitized = sanitizeAssessmentEvidenceCapture(input);
    for (const [key, value] of Object.entries(sanitized) as Array<
      [AssessmentEvidenceCaptureField, string]
    >) {
      if (value) {
        merged[key] = value;
      }
    }
  }

  return merged;
}

export function extractAssessmentEvidenceCapture(input: unknown): AssessmentEvidenceCapture {
  const root = asObject(input);
  const metadata = asObject(root.metadata);
  const payload = asObject(root.payload);
  const nestedPayload = asObject(payload.payload);
  const nestedMetadata = asObject(payload.metadata);
  const diagnosticsMeta = asObject(root.diagnosticsMeta);
  const upstreamContext = asObject(diagnosticsMeta.upstreamContext);

  return mergeAssessmentEvidenceCapture(
    sanitizeAssessmentEvidenceCapture(root.evidenceCapture as AssessmentEvidenceCapture),
    sanitizeAssessmentEvidenceCapture(metadata.evidenceCapture as AssessmentEvidenceCapture),
    sanitizeAssessmentEvidenceCapture(payload.evidenceCapture as AssessmentEvidenceCapture),
    sanitizeAssessmentEvidenceCapture(nestedMetadata.evidenceCapture as AssessmentEvidenceCapture),
    sanitizeAssessmentEvidenceCapture(nestedPayload.evidenceCapture as AssessmentEvidenceCapture),
    sanitizeAssessmentEvidenceCapture(upstreamContext.evidenceCapture as AssessmentEvidenceCapture),
  );
}

export function fieldLabelForAssessmentEvidenceCapture(
  field: AssessmentEvidenceCaptureField,
): string {
  switch (field) {
    case "priorAttempts":
      return "Prior attempts";
    case "failureCause":
      return "Failure cause";
    case "recurrenceSignal":
      return "Recurrence";
    case "verificationCriteria":
      return "Verification criteria";
    case "stopSignal":
      return "Stop signal";
    case "escalationTrigger":
      return "Escalation trigger";
    case "decisionDependency":
      return "Decision dependency";
    case "consequenceFinancial":
      return "Financial consequence";
    case "consequenceReputational":
      return "Reputational consequence";
    case "consequenceInstitutional":
      return "Institutional consequence";
    case "consequenceTimeline":
      return "Timeline consequence";
    default:
      return field;
  }
}

export function isUnsafeAssessmentEvidenceText(value: string | null | undefined): boolean {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return false;

  return UNSAFE_EVIDENCE_PATTERNS.some((pattern) => pattern.test(text));
}

export function summarizeAssessmentEvidenceText(
  value: string | null | undefined,
  maxLength = 180,
): string {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}
