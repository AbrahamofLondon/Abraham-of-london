import type { CounselReviewSubmission } from "@/lib/product/counsel-assignment-contract";

export function validateCounselReviewSubmission(input: CounselReviewSubmission): string[] {
  const errors: string[] = [];
  if (!input.workflowId) errors.push("workflowId is required.");
  if (!input.caseId) errors.push("caseId is required.");
  if (!input.triggerReason) errors.push("triggerReason is required.");
  if (!input.evidenceBasis.length) errors.push("evidenceBasis is required.");
  if (!input.recommendation) errors.push("recommendation is required.");
  if (!input.contradictionAssessment) errors.push("contradictionAssessment is required.");
  if (!input.riskIfIgnored) errors.push("riskIfIgnored is required.");
  if (!input.requiredClientAction) errors.push("requiredClientAction is required.");
  return errors;
}
