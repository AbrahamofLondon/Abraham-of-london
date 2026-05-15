import type { EffectiveAccess } from "@/lib/access/types";

export type ProvenancePolicyAction =
  | "VIEW_FULL_PROVENANCE"
  | "VIEW_CLIENT_SAFE_PROVENANCE"
  | "VERIFY_PROVENANCE_HASH"
  | "CREATE_PROVENANCE_ANCHOR"
  | "EXPORT_PROVENANCE"
  | "PUBLISH_PUBLIC_ROOT";

export type ProvenanceAccessSubject = {
  access?: Pick<EffectiveAccess, "permissions" | "role"> | null;
} | null | undefined;

export type ProvenanceAccessDecision = {
  allowed: boolean;
  reason:
    | "ALLOWED_ADMIN_OR_OWNER"
    | "AUTHENTICATION_REQUIRED"
    | "ADMIN_OR_OWNER_REQUIRED"
    | "UNKNOWN_ACTION";
};

const KNOWN_ACTIONS = new Set<ProvenancePolicyAction>([
  "VIEW_FULL_PROVENANCE",
  "VIEW_CLIENT_SAFE_PROVENANCE",
  "VERIFY_PROVENANCE_HASH",
  "CREATE_PROVENANCE_ANCHOR",
  "EXPORT_PROVENANCE",
  "PUBLISH_PUBLIC_ROOT",
]);

export function canAccessProvenanceOperation(
  subject: ProvenanceAccessSubject,
  action: ProvenancePolicyAction | string,
): ProvenanceAccessDecision {
  if (!KNOWN_ACTIONS.has(action as ProvenancePolicyAction)) {
    return {
      allowed: false,
      reason: "UNKNOWN_ACTION",
    };
  }

  const permissions = subject?.access?.permissions;
  if (!permissions?.isAuthenticated) {
    return {
      allowed: false,
      reason: "AUTHENTICATION_REQUIRED",
    };
  }

  if (permissions.isAdmin || permissions.isOwner) {
    return {
      allowed: true,
      reason: "ALLOWED_ADMIN_OR_OWNER",
    };
  }

  return {
    allowed: false,
    reason: "ADMIN_OR_OWNER_REQUIRED",
  };
}

export function assertProvenanceOperationAllowed(
  subject: ProvenanceAccessSubject,
  action: ProvenancePolicyAction,
): boolean {
  return canAccessProvenanceOperation(subject, action).allowed;
}
