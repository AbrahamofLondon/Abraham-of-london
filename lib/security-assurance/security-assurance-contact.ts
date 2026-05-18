import {
  getSecurityAssuranceMaterialById,
} from "./security-assurance-pack-registry";

export const DEFAULT_SECURITY_ASSURANCE_MATERIAL_ID =
  "security-assurance-readiness";

export type SecurityAssuranceContactFields = {
  name?: string | null;
  email?: string | null;
  organisation?: string | null;
  role?: string | null;
  procurementStage?: string | null;
  message?: string | null;
};

function toOptionalString(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveSecurityAssuranceMaterialId(
  requestedMaterialId?: string | null,
): string {
  if (
    requestedMaterialId &&
    getSecurityAssuranceMaterialById(requestedMaterialId)
  ) {
    return requestedMaterialId;
  }

  return DEFAULT_SECURITY_ASSURANCE_MATERIAL_ID;
}

export function createSecurityAssuranceRequestPayload(
  fields: SecurityAssuranceContactFields,
  requestedMaterialId: string | null | undefined,
  gRecaptchaToken: string,
) {
  return {
    name: toOptionalString(fields.name),
    email: fields.email?.trim() ?? "",
    organisation: toOptionalString(fields.organisation),
    role: toOptionalString(fields.role),
    requestedMaterial: resolveSecurityAssuranceMaterialId(requestedMaterialId),
    procurementStage: toOptionalString(fields.procurementStage),
    message: toOptionalString(fields.message),
    gRecaptchaToken,
  };
}

export function getSecurityAssuranceSubmissionErrorMessage(
  status: number,
  code?: string,
): string {
  if (
    status === 403 ||
    code === "ERR_MISSING_TOKEN" ||
    code === "ERR_RECAPTCHA_FAILED"
  ) {
    return "Security verification failed. Please refresh and try again.";
  }

  if (status === 429 || code === "RATE_LIMITED") {
    return "Too many requests were received. Please wait briefly and try again.";
  }

  if (status === 400 || code === "VALIDATION_ERROR") {
    return "Please check the request details and try again.";
  }

  if (status >= 500 || code === "REQUEST_SERVICE_UNAVAILABLE") {
    return "Request service is temporarily unavailable. Please use email if the issue persists.";
  }

  return "Transmission failed. Please try again.";
}
