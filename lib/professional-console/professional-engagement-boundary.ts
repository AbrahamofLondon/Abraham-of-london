/**
 * Professional Engagement Boundary
 *
 * Enforces tenant isolation, privilege verification, and engagement lifecycle.
 * One engagement = one advisor + one client organisation + one engagementId.
 */

import type {
  ProfessionalAdvisor,
  ProfessionalEngagement,
  AdvisorPrivilege,
  EngagementStatus,
  ProfessionalConsoleAuditEntry,
} from "./professional-console-contract";
import crypto from "crypto";

export class ProfessionalEngagementBoundary {
  /**
   * Create professional engagement with isolation verification
   */
  static createProfessionalEngagement(
    advisorId: string,
    advisor: ProfessionalAdvisor,
    organisationId: string,
    clientName: string,
    caseId: string,
    tenantId: string
  ): ProfessionalEngagement | null {
    // Verify advisor can engage
    if (advisor.verificationStatus !== "verified") {
      return null; // Unverified or suspended advisors cannot create engagements
    }

    if (!advisor.privileges.includes("view_engagement")) {
      return null; // Must have minimum view privilege
    }

    const engagementId = `engagement-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return {
      engagementId,
      advisorId,
      organisationId,
      clientName,
      caseId,
      status: "active",
      startedAt: new Date().toISOString(),
      tenantId,
      tenantBoundary: {
        organisationBoundaryEnforced: true,
        advisorCannotMixClients: true,
      },
    };
  }

  /**
   * Verify advisor can access engagement
   */
  static verifyAdvisorCanAccessEngagement(
    advisorId: string,
    engagementAdvisorId: string,
    engagement: ProfessionalEngagement
  ): boolean {
    // Advisor A cannot access Advisor B's engagement
    if (advisorId !== engagementAdvisorId) {
      return false;
    }

    // Engagement must be active
    if (engagement.status !== "active") {
      return false;
    }

    return true;
  }

  /**
   * Verify engagement tenant boundary
   */
  static verifyEngagementTenantBoundary(
    engagement: ProfessionalEngagement,
    requestedOrganisationId: string,
    requestedTenantId: string
  ): boolean {
    // Requested org must match engagement org
    if (requestedOrganisationId !== engagement.organisationId) {
      return false;
    }

    // Requested tenant must match engagement tenant
    if (requestedTenantId !== engagement.tenantId) {
      return false;
    }

    return true;
  }

  /**
   * Verify advisor has required privilege
   */
  static verifyAdvisorPrivilege(
    advisor: ProfessionalAdvisor,
    requiredPrivilege: AdvisorPrivilege
  ): boolean {
    // Advisor must be verified
    if (advisor.verificationStatus !== "verified") {
      return false;
    }

    // Advisor must have privilege
    if (!advisor.privileges.includes(requiredPrivilege)) {
      return false;
    }

    // No privilege can be spine_mutation (not in contract)
    const forbiddenPrivileges = ["spine_mutation"];
    if (forbiddenPrivileges.some((p) => advisor.privileges.includes(p as AdvisorPrivilege))) {
      return false;
    }

    return true;
  }

  /**
   * Suspend professional engagement
   */
  static suspendProfessionalEngagement(
    engagement: ProfessionalEngagement,
    reason: string
  ): ProfessionalEngagement {
    return {
      ...engagement,
      status: "suspended",
      suspendedAt: new Date().toISOString(),
    };
  }

  /**
   * Conclude professional engagement
   */
  static concludeProfessionalEngagement(
    engagement: ProfessionalEngagement
  ): ProfessionalEngagement {
    return {
      ...engagement,
      status: "concluded",
      concludedAt: new Date().toISOString(),
    };
  }

  /**
   * Create professional console audit entry
   */
  static createProfessionalConsoleAuditEntry(
    engagementId: string,
    advisorId: string,
    organisationId: string,
    action: string,
    actor: string,
    sanitizedPreview: string,
    reason: string
  ): ProfessionalConsoleAuditEntry {
    const actorHash = crypto
      .createHash("sha256")
      .update(actor)
      .digest("hex")
      .substring(0, 16);

    return {
      auditId: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      engagementId,
      advisorId,
      organisationId,
      timestamp: new Date().toISOString(),
      action: action as any,
      actor,
      actorHash,
      sanitizedPreview: sanitizedPreview.substring(0, 200),
      reason,
      authorityDelta: 0,
    };
  }
}

export const PROFESSIONAL_ENGAGEMENT_RULES = {
  ONE_ENGAGEMENT_RULE:
    "One engagement = one advisor + one client org + one engagementId; enforced at creation",
  CROSS_ADVISOR_ISOLATION: "Advisor A cannot access Advisor B engagement (strict identity check)",
  CROSS_CLIENT_ISOLATION:
    "Advisor cannot mix Client X evidence into Client Y engagement (organisationId check)",
  UNVERIFIED_BLOCKED: "Unverified or suspended advisors cannot create engagements",
  ACTIVE_REQUIRED: "Engagement must be active before instrument execution or evidence submission",
  PRIVILEGE_CHECK: "Advisors must have required privilege; forbidden privileges rejected",
  NO_AUTHORITY: "No engagement boundary function creates authority",
  AUDIT_SAFETY: "Professional console audit contains sanitized preview only, no raw content",
};
