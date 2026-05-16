export type CaseShareRole = "VIEWER" | "AUDITOR";

export type CaseShareStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "REVOKED";

export type CaseShareRecord = {
  id: string;
  caseId: string;
  ownerEmail: string;
  recipientEmail?: string | null;
  role: CaseShareRole;
  status: CaseShareStatus;
  tokenHash: string;
  allowExport: boolean;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string | null;
};

export type SharedCaseView = {
  caseId: string;
  caseRef: string;
  title: string;
  status: string;
  summary: string;
  evidencePosture?: string | null;
  governanceImplication?: string | null;
  nextAction?: string | null;
  provenanceStatus:
    | "AVAILABLE"
    | "PENDING"
    | "UNAVAILABLE"
    | "UNSUPPORTED";
  canVerify: boolean;
  canExport: boolean;
};

export const CASE_SHARE_BOUNDARY_NOTE =
  "This shared view is client-safe. It does not expose raw evidence, internal review notes, suppression details, private actor metadata, or editable case controls.";
