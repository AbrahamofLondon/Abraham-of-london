/**
 * Connector Secret Boundary
 *
 * Prevents webhook secrets from leaking to logs, client bundles, or test code.
 * Secrets must be environment-scoped and never exposed in development/synthetic modes.
 */

export type SecretExposureType =
  | "in_logs"
  | "in_client_bundle"
  | "in_test_code"
  | "in_config_file"
  | "in_memory_unscoped";

export interface SecretBoundaryViolation {
  violated: true;
  exposureType: SecretExposureType;
  severity: "critical" | "high";
  location: string;
  remediation: string;
}

export class ConnectorSecretBoundary {
  /**
   * Classify secret state
   */
  static classifyConnectorSecretState(config: any): {
    isScoped: boolean;
    isPlaceholder: boolean;
    isProduction: boolean;
    violations: SecretBoundaryViolation[];
  } {
    const violations: SecretBoundaryViolation[] = [];

    // CHECK 1: Secret not in logs
    if (config.secretFoundInLogs) {
      violations.push({
        violated: true,
        exposureType: "in_logs",
        severity: "critical",
        location: "Application logs",
        remediation: "Remove secret from logs; use environment variable reference only",
      });
    }

    // CHECK 2: Secret not in client bundle
    if (config.secretFoundInClientBundle) {
      violations.push({
        violated: true,
        exposureType: "in_client_bundle",
        severity: "critical",
        location: "Client-side JavaScript bundle",
        remediation: "Never include secrets in frontend code; server-side only",
      });
    }

    // CHECK 3: Secret not in test code
    if (config.productionSecretInTestCode) {
      violations.push({
        violated: true,
        exposureType: "in_test_code",
        severity: "high",
        location: "Test/synthetic code",
        remediation: "Use placeholder secrets in tests; never use production secrets",
      });
    }

    // CHECK 4: Environment scoped
    const isScoped =
      config.environmentMode === "production" &&
      !!config.webhookSecretFromEnvironment;

    // CHECK 5: Placeholder vs real
    const isPlaceholder =
      !config.webhookSecret ||
      config.webhookSecret === "placeholder-secret-for-testing";

    return {
      isScoped,
      isPlaceholder,
      isProduction: config.environmentMode === "production",
      violations,
    };
  }

  /**
   * Assert no secret in client bundle
   */
  static assertNoSecretInClientBundle(bundleContent: string): {
    safe: boolean;
    foundPatterns: string[];
  } {
    const dangerousPatterns = [
      /xoxb-[a-zA-Z0-9-]+/g, // Slack bot token
      /xoxp-[a-zA-Z0-9-]+/g, // Slack user token
      /xoxr-[a-zA-Z0-9-]+/g, // Slack refresh token
      /jira.*webhook.*secret/i, // Jira patterns
    ];

    const foundPatterns: string[] = [];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(bundleContent)) {
        foundPatterns.push(pattern.toString());
      }
    }

    return {
      safe: foundPatterns.length === 0,
      foundPatterns,
    };
  }

  /**
   * Assert no secret in logs
   */
  static assertNoSecretInLogs(logContent: string): {
    safe: boolean;
    secretReferences: number;
  } {
    const secretPatterns = [
      /webhookSecret["\']?\s*[:=]\s*["\']([^"\']+)["\']?/gi,
      /xoxb-[a-zA-Z0-9-]+/gi,
      /xoxp-[a-zA-Z0-9-]+/gi,
    ];

    let secretReferences = 0;

    for (const pattern of secretPatterns) {
      const matches = logContent.match(pattern);
      if (matches) {
        secretReferences += matches.length;
      }
    }

    return {
      safe: secretReferences === 0,
      secretReferences,
    };
  }

  /**
   * Assert environment-scoped secret
   */
  static assertEnvironmentScopedSecret(
    environmentMode: string,
    secretSource: string
  ): {
    isProper: boolean;
    reason: string;
  } {
    if (environmentMode === "production") {
      if (secretSource !== "environment_variable") {
        return {
          isProper: false,
          reason:
            "Production secrets must come from environment variables, not hardcoded",
        };
      }

      return {
        isProper: true,
        reason: "Production secret properly scoped to environment",
      };
    }

    // Non-production must use placeholder
    if (secretSource === "hardcoded_production_secret") {
      return {
        isProper: false,
        reason: "Development/synthetic mode must use placeholder, not production secret",
      };
    }

    return {
      isProper: true,
      reason: "Non-production secret properly scoped",
    };
  }

  /**
   * Assert webhook secret present for production
   */
  static assertWebhookSecretPresentForProduction(
    environmentMode: string,
    secret?: string
  ): {
    valid: boolean;
    reason: string;
  } {
    if (environmentMode !== "production") {
      return {
        valid: true,
        reason: "Non-production mode, placeholder acceptable",
      };
    }

    if (!secret) {
      return {
        valid: false,
        reason: "Production mode requires actual webhook secret",
      };
    }

    if (secret === "placeholder-secret-for-testing") {
      return {
        valid: false,
        reason: "Production mode cannot use placeholder secret",
      };
    }

    return {
      valid: true,
      reason: "Production webhook secret present",
    };
  }

  /**
   * Assert webhook secret absent from synthetic tests
   */
  static assertWebhookSecretAbsentFromSyntheticTests(
    testCode: string
  ): {
    safe: boolean;
    usesProduction: boolean;
  } {
    const productionSecretPattern = /xox[barp]-[a-zA-Z0-9-]{50,}/g;
    const jiraSecretPattern = /jira.*webhook.*[a-zA-Z0-9]{40,}/i;

    const usesProduction =
      productionSecretPattern.test(testCode) ||
      jiraSecretPattern.test(testCode);

    return {
      safe: !usesProduction,
      usesProduction,
    };
  }
}
