export type RetainedProductRole =
  | "OWNER"
  | "SPONSOR"
  | "RESPONDENT"
  | "OPERATOR"
  | "COUNSEL_REVIEWER"
  | "ADMIN";

export function canViewSponsorCommandSummary(role: RetainedProductRole | null | undefined) {
  return role === "OWNER" || role === "SPONSOR" || role === "OPERATOR" || role === "ADMIN";
}

export function canViewRawRespondentText(role: RetainedProductRole | null | undefined) {
  return role === "ADMIN";
}

export function canViewOperatorNotes(role: RetainedProductRole | null | undefined) {
  return role === "OPERATOR" || role === "ADMIN";
}

export function canViewCounselNotes(role: RetainedProductRole | null | undefined) {
  return role === "COUNSEL_REVIEWER" || role === "ADMIN";
}

export function canManageCadence(role: RetainedProductRole | null | undefined) {
  return role === "OPERATOR" || role === "ADMIN";
}

export function canViewBoardroomArchive(role: RetainedProductRole | null | undefined) {
  return role === "OWNER" || role === "SPONSOR" || role === "OPERATOR" || role === "ADMIN";
}

export function canViewPortfolioMemory(role: RetainedProductRole | null | undefined) {
  return role === "OWNER" || role === "SPONSOR" || role === "OPERATOR" || role === "ADMIN";
}

export function deriveRetainedProductRole(input: {
  isAdmin?: boolean;
  organisationRole?: string | null;
  authenticated?: boolean;
}): RetainedProductRole | null {
  if (input.isAdmin) return "ADMIN";
  const orgRole = String(input.organisationRole || "").toUpperCase();
  if (orgRole.includes("COUNSEL") || orgRole.includes("LEGAL")) return "COUNSEL_REVIEWER";
  if (orgRole.includes("OPERATOR") || orgRole.includes("REVIEWER") || orgRole.includes("FINANCE") || orgRole.includes("ADMIN")) return "OPERATOR";
  if (orgRole === "OWNER") return "OWNER";
  if (orgRole.includes("SPONSOR") || orgRole.includes("DIRECTOR") || orgRole.includes("PRINCIPAL") || orgRole.includes("EXECUTIVE")) return "SPONSOR";
  if (orgRole.includes("RESPONDENT") || orgRole.includes("PARTICIPANT") || orgRole.includes("MEMBER") || orgRole.includes("CLIENT")) return "RESPONDENT";
  return input.authenticated ? "OWNER" : null;
}
