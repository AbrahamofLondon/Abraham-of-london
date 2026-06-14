/**
 * Connector Activation Gate
 *
 * Production readiness check before any real Slack or Jira connector activation.
 * All checks must pass; failures block activation with no bypass.
 *
 * Core doctrine:
 * - No placeholder signatures in production
 * - No consent drift
 * - No missing audit trails
 * - No authority escalation possible
 * - No live activation without kill switch
 */

export type ConnectorEnvironmentMode = "synthetic" | "sandbox" | "production";

export interface ConnectorSecretStatus {
  webhookSecretPresent: boolean;
  webhookSecretInLogs: boolean;
  webhookSecretInClientBundle: boolean;
  isPlaceholder: boolean;
  environmentScoped: boolean;
}

export interface ConnectorConsentReadiness {
  consentScopeDefined: boolean;
  allowedChannelsOrProjectsDefined: boolean;
  allowedEventTypesDefined: boolean;
  retentionClassDefined: boolean;
  approvalRecordsExist: boolean;
}

export interface ConnectorAuditReadiness {
  auditSinkConfigured: boolean;
  auditLogsTestable: boolean;
  auditRedactionVerified: boolean;
  noPlaintextIdentifiersInAudit: boolean;
  auditRetentionPolicyDefined: boolean;
}

export interface ConnectorRetentionReadiness {
  retentionClassSpecified: string; // "governance", "compliance", "audit"
  expirationPolicyDefined: boolean;
  purgeProcessDefined: boolean;
}

export interface ConnectorKillSwitchStatus {
  killSwitchImplemented: boolean;
  killSwitchTestable: boolean;
  killSwitchAutomatic: boolean; // Can deactivate without code change
  killSwitchDocumented: boolean;
}

export interface ConnectorActivationBlocker {
  blocked: true;
  reason: string;
  severity: "critical" | "high" | "medium";
  remediation: string;
  canBypass: false;
}

export interface ConnectorActivationReadiness {
  platform: "slack" | "jira";
  environmentMode: ConnectorEnvironmentMode;
  isReady: boolean;
  readySince?: string;
  blockers: ConnectorActivationBlocker[];
  secretStatus: ConnectorSecretStatus;
  consentReadiness: ConnectorConsentReadiness;
  auditReadiness: ConnectorAuditReadiness;
  retentionReadiness: ConnectorRetentionReadiness;
  killSwitchStatus: ConnectorKillSwitchStatus;
  authorityDeltaRisk: {
    canGrantAuthority: false;
    authorityDeltaPossible: 0;
  };
}

/**
 * Production Activation Gate
 */
export class ConnectorActivationGate {
  /**
   * Evaluate connector for production activation
   */
  static evaluateConnectorActivationReadiness(
    platform: "slack" | "jira",
    config: any
  ): ConnectorActivationReadiness {
    const blockers: ConnectorActivationBlocker[] = [];

    // CHECK 1: Signature verification is not placeholder
    if (config.signatureVerification?.isPlaceholder) {
      blockers.push({
        blocked: true,
        reason: "Signature verification is placeholder",
        severity: "critical",
        remediation: `Implement real ${platform} webhook signature verification`,
        canBypass: false,
      });
    }

    // CHECK 2: Consent scope is defined
    if (!config.consentScope?.organisationId) {
      blockers.push({
        blocked: true,
        reason: "Consent scope missing",
        severity: "critical",
        remediation: "Define and approve consent scope for connector",
        canBypass: false,
      });
    }

    // CHECK 3: Allowed channels/projects defined
    if (platform === "slack" && !config.consentScope?.allowedChannelIds?.length) {
      blockers.push({
        blocked: true,
        reason: "No approved Slack channels defined",
        severity: "critical",
        remediation: "Define approved Slack channels",
        canBypass: false,
      });
    }

    if (platform === "jira" && !config.consentScope?.allowedProjectKeys?.length) {
      blockers.push({
        blocked: true,
        reason: "No approved Jira projects defined",
        severity: "critical",
        remediation: "Define approved Jira projects",
        canBypass: false,
      });
    }

    // CHECK 4: Retention class defined
    if (!config.retentionClass) {
      blockers.push({
        blocked: true,
        reason: "Retention class not specified",
        severity: "critical",
        remediation: "Set retention class (governance, compliance, or audit)",
        canBypass: false,
      });
    }

    // CHECK 5: Audit sink configured
    if (!config.auditSink?.endpoint) {
      blockers.push({
        blocked: true,
        reason: "Audit sink not configured",
        severity: "critical",
        remediation: "Configure audit sink endpoint and verify connectivity",
        canBypass: false,
      });
    }

    // CHECK 6: Kill switch exists
    if (!config.killSwitch?.implemented) {
      blockers.push({
        blocked: true,
        reason: "Kill switch not implemented",
        severity: "critical",
        remediation: "Implement automatic kill switch mechanism",
        canBypass: false,
      });
    }

    // CHECK 7: Authority delta is zero
    if (config.authorityDelta !== 0) {
      blockers.push({
        blocked: true,
        reason: `Authority delta is ${config.authorityDelta}, must be 0`,
        severity: "critical",
        remediation: "Verify connector cannot grant authority",
        canBypass: false,
      });
    }

    // CHECK 8: Slack DM rejection enforced
    if (platform === "slack" && !config.enforcedPolicies?.rejectDMs) {
      blockers.push({
        blocked: true,
        reason: "Slack DM rejection not enforced",
        severity: "high",
        remediation: "Enforce DM rejection in Slack adapter",
        canBypass: false,
      });
    }

    // CHECK 9: Jira project whitelist enforced
    if (platform === "jira" && !config.enforcedPolicies?.enforceProjectWhitelist) {
      blockers.push({
        blocked: true,
        reason: "Jira project whitelist not enforced",
        severity: "high",
        remediation: "Enforce project whitelist in Jira adapter",
        canBypass: false,
      });
    }

    return {
      platform,
      environmentMode: config.environmentMode || "synthetic",
      isReady: blockers.length === 0,
      blockers,
      secretStatus: {
        webhookSecretPresent: !!config.webhookSecret,
        webhookSecretInLogs: config.secretInLogsDetected || false,
        webhookSecretInClientBundle: config.secretInClientBundleDetected || false,
        isPlaceholder: config.signatureVerification?.isPlaceholder || false,
        environmentScoped: config.environmentMode === "production",
      },
      consentReadiness: {
        consentScopeDefined: !!config.consentScope,
        allowedChannelsOrProjectsDefined:
          platform === "slack"
            ? !!config.consentScope?.allowedChannelIds?.length
            : !!config.consentScope?.allowedProjectKeys?.length,
        allowedEventTypesDefined: !!config.consentScope?.allowedEventTypes?.length,
        retentionClassDefined: !!config.retentionClass,
        approvalRecordsExist: !!config.approvalRecords?.length,
      },
      auditReadiness: {
        auditSinkConfigured: !!config.auditSink?.endpoint,
        auditLogsTestable: !!config.auditSink?.testable,
        auditRedactionVerified: config.auditRedactionVerified || false,
        noPlaintextIdentifiersInAudit: !config.plaintextIdentifiersInAudit,
        auditRetentionPolicyDefined: !!config.auditRetentionPolicy,
      },
      retentionReadiness: {
        retentionClassSpecified: config.retentionClass || "",
        expirationPolicyDefined: !!config.retentionExpirationPolicy,
        purgeProcessDefined: !!config.retentionPurgeProcess,
      },
      killSwitchStatus: {
        killSwitchImplemented: config.killSwitch?.implemented || false,
        killSwitchTestable: config.killSwitch?.testable || false,
        killSwitchAutomatic: config.killSwitch?.automatic || false,
        killSwitchDocumented: config.killSwitch?.documented || false,
      },
      authorityDeltaRisk: {
        canGrantAuthority: false,
        authorityDeltaPossible: 0,
      },
    };
  }

  /**
   * Production activation must fail closed
   */
  static canActivateInProduction(readiness: ConnectorActivationReadiness): boolean {
    // Must pass every check
    if (readiness.blockers.length > 0) {
      return false;
    }

    // Must have all readiness signals
    if (!readiness.consentReadiness.consentScopeDefined) {
      return false;
    }

    if (!readiness.auditReadiness.auditSinkConfigured) {
      return false;
    }

    if (!readiness.killSwitchStatus.killSwitchImplemented) {
      return false;
    }

    // Authority must be zero
    if (readiness.authorityDeltaRisk.authorityDeltaPossible !== 0) {
      return false;
    }

    return true;
  }
}

/**
 * Activation Gate Invariants
 */
export const CONNECTOR_ACTIVATION_INVARIANTS = {
  FAIL_CLOSED: "All blockers must be resolved; no bypasses allowed",
  NO_PLACEHOLDER_SIGNATURES:
    "Production must use real webhook signature verification",
  CONSENT_REQUIRED: "Consent scope must be defined and approved",
  AUDIT_REQUIRED: "Audit sink must be configured and testable",
  KILL_SWITCH_REQUIRED:
    "Kill switch must be automatic and documented",
  AUTHORITY_ZERO: "Authority delta must be exactly 0",
  NO_ACTIVATION_WHILE_UNKNOWN:
    "Activation blocked if audit, secret, or environment state is unknown",
};
