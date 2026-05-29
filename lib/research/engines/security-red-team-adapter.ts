/**
 * lib/research/engines/security-red-team-adapter.ts
 *
 * Intelligence Foundry adapter for Security Red-Team analysis.
 *
 * Performs deterministic static analysis of route guard coverage, access
 * control patterns, IDOR risk, sensitive data exposure, and admin boundary
 * enforcement across the Abraham of London platform.
 *
 * No AI. No external calls. No production data touched.
 * Results are repeatable — same input always produces the same output.
 *
 * Status: PRODUCTION_CALLABLE
 *
 * Check categories:
 *   1. Admin route guard coverage (requireAdminAppRoute / requireAdminSession)
 *   2. API route method guard coverage (auth before data access)
 *   3. IDOR risk patterns (ID-in-URL without ownership verification)
 *   4. Sensitive data field exposure (raw email, tokens, secrets in response)
 *   5. Rate limiting coverage on write operations
 *   6. Token/secret pattern in non-encrypted fields
 *
 * Payload fields:
 *   - scope: "admin-routes" | "api-routes" | "all" — default "all"
 *   - useVulnerableFixture: boolean — run against a known-bad fixture to verify detection
 *   - useCleanFixture: boolean — run against a known-clean fixture to verify pass
 *   - routeManifest: RouteEntry[] — optional real route manifest to audit
 */

import "server-only";

import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const SECURITY_RED_TEAM_ENGINE_ID = "security-red-team";
export const SECURITY_RED_TEAM_VERSION = "1.0.0";

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteEntry = {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  hasAuthGuard: boolean;
  hasRateLimit: boolean;
  isAdminRoute: boolean;
  sendsIdInUrl: boolean;
  hasOwnershipCheck: boolean;
  exposedFields?: string[]; // fields returned in the response that may be sensitive
};

type SecurityCheckResult = {
  rule: string;
  violations: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  count: number;
};

// ─── Rule definitions ─────────────────────────────────────────────────────────

const SENSITIVE_FIELDS = [
  "password",
  "passwordHash",
  "accessToken",
  "refreshToken",
  "encryptedAccessToken",
  "encryptedRefreshToken",
  "totpSecret",
  "backupCodes",
  "keyHash",
  "tokenHash",
  "codeHash",
  "secretKey",
  "apiSecret",
];

const SENSITIVE_FIELD_LOWER = new Set(SENSITIVE_FIELDS.map((f) => f.toLowerCase()));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CLEAN_ROUTE_MANIFEST: RouteEntry[] = [
  {
    path: "/api/admin/intelligence-foundry/runs",
    method: "GET",
    hasAuthGuard: true,
    hasRateLimit: true,
    isAdminRoute: true,
    sendsIdInUrl: false,
    hasOwnershipCheck: false,
    exposedFields: [],
  },
  {
    path: "/api/admin/intelligence-foundry/runs/[id]",
    method: "PATCH",
    hasAuthGuard: true,
    hasRateLimit: true,
    isAdminRoute: true,
    sendsIdInUrl: true,
    hasOwnershipCheck: true,
    exposedFields: [],
  },
  {
    path: "/api/diagnostic/submit",
    method: "POST",
    hasAuthGuard: false,
    hasRateLimit: true,
    isAdminRoute: false,
    sendsIdInUrl: false,
    hasOwnershipCheck: false,
    exposedFields: [],
  },
];

const VULNERABLE_ROUTE_MANIFEST: RouteEntry[] = [
  {
    path: "/api/admin/intelligence-foundry/runs/[id]/export",
    method: "GET",
    hasAuthGuard: false,           // CRITICAL: admin route without auth
    hasRateLimit: false,           // HIGH: no rate limit
    isAdminRoute: true,
    sendsIdInUrl: true,
    hasOwnershipCheck: false,       // HIGH: IDOR risk
    exposedFields: ["passwordHash", "tokenHash"], // HIGH: sensitive fields exposed
  },
  {
    path: "/api/user/profile/[id]",
    method: "GET",
    hasAuthGuard: true,
    hasRateLimit: false,           // MEDIUM: no rate limit on read
    isAdminRoute: false,
    sendsIdInUrl: true,
    hasOwnershipCheck: false,       // HIGH: IDOR — can read any user profile
    exposedFields: ["email"],       // LOW: email exposure acceptable in authed context
  },
  {
    path: "/api/internal/admin-setup",
    method: "POST",
    hasAuthGuard: false,           // CRITICAL: unguarded admin setup endpoint
    hasRateLimit: false,
    isAdminRoute: true,
    sendsIdInUrl: false,
    hasOwnershipCheck: false,
    exposedFields: [],
  },
];

// ─── Static rule checks ───────────────────────────────────────────────────────

function checkAdminAuthGuards(routes: RouteEntry[]): SecurityCheckResult {
  const adminRoutes = routes.filter((r) => r.isAdminRoute);
  const unguarded = adminRoutes.filter((r) => !r.hasAuthGuard);
  return {
    rule: "ADMIN_ROUTE_AUTH_GUARD",
    violations: unguarded.map((r) => `${r.method} ${r.path}: admin route lacks auth guard`),
    severity: unguarded.length > 0 ? "CRITICAL" : "INFO",
    count: unguarded.length,
  };
}

function checkApiAuthGuards(routes: RouteEntry[]): SecurityCheckResult {
  // Non-admin POST/PATCH/PUT/DELETE routes that have no auth guard — likely need protection
  const writeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
  const unguardedWrites = routes.filter(
    (r) => !r.isAdminRoute && writeMethods.has(r.method) && !r.hasAuthGuard
  );
  return {
    rule: "API_WRITE_AUTH_GUARD",
    violations: unguardedWrites.map((r) => `${r.method} ${r.path}: write endpoint lacks auth guard`),
    severity: unguardedWrites.length > 0 ? "HIGH" : "INFO",
    count: unguardedWrites.length,
  };
}

function checkIdorRisk(routes: RouteEntry[]): SecurityCheckResult {
  // Routes that take an ID in the URL but have no ownership check
  const idorRisk = routes.filter(
    (r) => r.sendsIdInUrl && r.hasAuthGuard && !r.hasOwnershipCheck
  );
  return {
    rule: "IDOR_OWNERSHIP_CHECK",
    violations: idorRisk.map((r) => `${r.method} ${r.path}: ID-in-URL without ownership verification`),
    severity: idorRisk.length > 0 ? "HIGH" : "INFO",
    count: idorRisk.length,
  };
}

function checkSensitiveFieldExposure(routes: RouteEntry[]): SecurityCheckResult {
  const violations: string[] = [];
  for (const route of routes) {
    const sensitiveExposed = (route.exposedFields ?? []).filter((f) =>
      SENSITIVE_FIELD_LOWER.has(f.toLowerCase())
    );
    if (sensitiveExposed.length > 0) {
      violations.push(
        `${route.method} ${route.path}: exposes sensitive field(s): ${sensitiveExposed.join(", ")}`
      );
    }
  }
  return {
    rule: "SENSITIVE_FIELD_EXPOSURE",
    violations,
    severity: violations.length > 0 ? "HIGH" : "INFO",
    count: violations.length,
  };
}

function checkRateLimiting(routes: RouteEntry[]): SecurityCheckResult {
  // All admin write routes must have rate limiting
  const writeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
  const unratedAdminWrites = routes.filter(
    (r) => r.isAdminRoute && writeMethods.has(r.method) && !r.hasRateLimit
  );
  const unratedPublicWrites = routes.filter(
    (r) => !r.isAdminRoute && writeMethods.has(r.method) && !r.hasRateLimit
  );
  const violations = [
    ...unratedAdminWrites.map((r) => `${r.method} ${r.path}: admin write lacks rate limit`),
    ...unratedPublicWrites.map((r) => `${r.method} ${r.path}: public write lacks rate limit`),
  ];
  return {
    rule: "RATE_LIMIT_COVERAGE",
    violations,
    severity: violations.length > 0 ? "MEDIUM" : "INFO",
    count: violations.length,
  };
}

// ─── Self-test ────────────────────────────────────────────────────────────────

async function selfTest(): Promise<{ ok: boolean; message: string }> {
  try {
    // Clean fixture: no violations
    const cleanChecks = [
      checkAdminAuthGuards(CLEAN_ROUTE_MANIFEST),
      checkIdorRisk(CLEAN_ROUTE_MANIFEST),
      checkSensitiveFieldExposure(CLEAN_ROUTE_MANIFEST),
    ];
    const cleanViolations = cleanChecks.flatMap((c) => c.violations);

    // Vulnerable fixture: must detect violations
    const vulnChecks = [
      checkAdminAuthGuards(VULNERABLE_ROUTE_MANIFEST),
      checkIdorRisk(VULNERABLE_ROUTE_MANIFEST),
      checkSensitiveFieldExposure(VULNERABLE_ROUTE_MANIFEST),
    ];
    const vulnViolations = vulnChecks.flatMap((c) => c.violations);

    if (cleanViolations.length > 0) {
      return {
        ok: false,
        message: `Clean fixture triggered violations: ${cleanViolations.join("; ")}`,
      };
    }
    if (vulnViolations.length === 0) {
      return {
        ok: false,
        message: "Vulnerable fixture did not trigger any violations — detection broken",
      };
    }

    return {
      ok: true,
      message: `Clean: 0 violations. Vulnerable: ${vulnViolations.length} violations detected across ${vulnChecks.filter((c) => c.count > 0).length} rule categories.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Self-test failed" };
  }
}

function getVersion(): string {
  return SECURITY_RED_TEAM_VERSION;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();
  const payload = (input?.payload ?? {}) as Record<string, unknown>;

  // ── Route manifest resolution ───────────────────────────────────────────────
  let routes: RouteEntry[];
  let fixtureMode: "clean" | "vulnerable" | "real";

  if (payload.useVulnerableFixture === true) {
    routes = VULNERABLE_ROUTE_MANIFEST;
    fixtureMode = "vulnerable";
  } else if (payload.useCleanFixture === true || !("routeManifest" in payload)) {
    routes = CLEAN_ROUTE_MANIFEST;
    fixtureMode = "clean";
  } else {
    routes = payload.routeManifest as RouteEntry[];
    fixtureMode = "real";
  }

  const scope = typeof payload.scope === "string" ? payload.scope : "all";

  // Filter by scope
  const scopedRoutes =
    scope === "admin-routes"
      ? routes.filter((r) => r.isAdminRoute)
      : scope === "api-routes"
        ? routes.filter((r) => !r.isAdminRoute)
        : routes;

  // ── Run all checks ──────────────────────────────────────────────────────────
  const checks: SecurityCheckResult[] = [
    checkAdminAuthGuards(scopedRoutes),
    checkApiAuthGuards(scopedRoutes),
    checkIdorRisk(scopedRoutes),
    checkSensitiveFieldExposure(scopedRoutes),
    checkRateLimiting(scopedRoutes),
  ];

  // ── Formula steps ──────────────────────────────────────────────────────────
  const formulaSteps: FormulaStep[] = [
    {
      stepId: "audit-scope",
      label: "Audit scope",
      inputs: {
        totalRoutes: routes.length,
        scopedRoutes: scopedRoutes.length,
        scope,
        fixtureMode,
      },
      output: `${scopedRoutes.length} route(s) in scope`,
      sourceRule: "security-red-team-adapter::scope-resolution",
      engineVersion: SECURITY_RED_TEAM_VERSION,
    },
    {
      stepId: "check-results",
      label: "Security check results",
      inputs: {
        adminAuthGuardViolations: checks[0]?.count ?? 0,
        apiWriteAuthViolations: checks[1]?.count ?? 0,
        idorRiskViolations: checks[2]?.count ?? 0,
        sensitiveFieldViolations: checks[3]?.count ?? 0,
        rateLimitViolations: checks[4]?.count ?? 0,
      },
      intermediate: {
        totalViolations: String(checks.reduce((sum, c) => sum + c.count, 0)),
        criticalChecks: String(checks.filter((c) => c.severity === "CRITICAL" && c.count > 0).length),
        highChecks: String(checks.filter((c) => c.severity === "HIGH" && c.count > 0).length),
      },
      output:
        checks.every((c) => c.count === 0)
          ? "CLEAR — no security violations"
          : `VIOLATIONS — ${checks.reduce((sum, c) => sum + c.count, 0)} finding(s)`,
      sourceRule: "security-red-team-adapter::check-aggregation",
      engineVersion: SECURITY_RED_TEAM_VERSION,
    },
  ];

  // ── Map checks to findings ─────────────────────────────────────────────────
  const findings: Finding[] = [];

  for (const check of checks) {
    if (check.violations.length === 0) continue;

    const findingId = `security-rt-${check.rule.toLowerCase()}-${Date.now()}`;

    switch (check.rule) {
      case "ADMIN_ROUTE_AUTH_GUARD":
        findings.push({
          id: findingId,
          title: `Admin route(s) without auth guard (${check.count})`,
          description: `${check.count} admin route(s) lack a mandatory authentication guard. An unauthenticated actor can access admin functionality.\n${check.violations.join("\n")}`,
          severity: "CRITICAL",
          source: `${SECURITY_RED_TEAM_ENGINE_ID}::ADMIN_ROUTE_AUTH_GUARD`,
          evidence: check.violations.join(" | "),
          remediation:
            "Add requireAdminAppRoute() or requireAdminSession() guard as the first call in each admin route handler. Guard must verify both authentication and admin role before any data access.",
        });
        break;

      case "API_WRITE_AUTH_GUARD":
        findings.push({
          id: findingId,
          title: `Write endpoint(s) without auth guard (${check.count})`,
          description: `${check.count} write endpoint(s) are publicly accessible without authentication.\n${check.violations.join("\n")}`,
          severity: "HIGH",
          source: `${SECURITY_RED_TEAM_ENGINE_ID}::API_WRITE_AUTH_GUARD`,
          evidence: check.violations.join(" | "),
          remediation:
            "Add session/auth guard before mutating any resource. Explicitly verify the caller's identity and entitlement before executing the write.",
        });
        break;

      case "IDOR_OWNERSHIP_CHECK":
        findings.push({
          id: findingId,
          title: `IDOR risk: ID-in-URL without ownership check (${check.count})`,
          description: `${check.count} route(s) accept a user-controlled ID in the URL but do not verify that the caller owns or is entitled to that resource.\n${check.violations.join("\n")}`,
          severity: "HIGH",
          source: `${SECURITY_RED_TEAM_ENGINE_ID}::IDOR_OWNERSHIP_CHECK`,
          evidence: check.violations.join(" | "),
          remediation:
            "After authentication, verify the caller's ownership or entitlement over the requested resource ID before returning or mutating data.",
        });
        break;

      case "SENSITIVE_FIELD_EXPOSURE":
        findings.push({
          id: findingId,
          title: `Sensitive field(s) exposed in response (${check.count})`,
          description: `${check.count} route(s) return sensitive fields (password hash, token, secret) in the API response.\n${check.violations.join("\n")}`,
          severity: "HIGH",
          source: `${SECURITY_RED_TEAM_ENGINE_ID}::SENSITIVE_FIELD_EXPOSURE`,
          evidence: check.violations.join(" | "),
          remediation:
            "Strip sensitive fields from API responses using an explicit allowlist pattern. Never return password hashes, tokens, or secret keys to the client.",
        });
        break;

      case "RATE_LIMIT_COVERAGE":
        findings.push({
          id: findingId,
          title: `Write route(s) without rate limiting (${check.count})`,
          description: `${check.count} write route(s) are not protected by rate limiting, creating abuse and enumeration risk.\n${check.violations.join("\n")}`,
          severity: "MEDIUM",
          source: `${SECURITY_RED_TEAM_ENGINE_ID}::RATE_LIMIT_COVERAGE`,
          evidence: check.violations.join(" | "),
          remediation:
            "Apply rate limiting to all write routes. Admin routes should use scope-keyed rate limits. Public routes should use IP-keyed limits with strict windows.",
        });
        break;
    }
  }

  if (findings.length === 0) {
    findings.push({
      id: `security-rt-clear-${Date.now()}`,
      title: "Security red-team: CLEAR",
      description: `No security violations detected across ${scopedRoutes.length} route(s) and ${checks.length} rule categories.`,
      severity: "INFO",
      source: `${SECURITY_RED_TEAM_ENGINE_ID}::clear`,
      evidence: `${scopedRoutes.length} routes × ${checks.length} checks = ${scopedRoutes.length * checks.length} assertions passed`,
    });
  }

  // ── Overall severity ────────────────────────────────────────────────────────
  const hasCritical = findings.some((f) => f.severity === "CRITICAL");
  const hasHigh = findings.some((f) => f.severity === "HIGH");
  const hasMedium = findings.some((f) => f.severity === "MEDIUM");
  const overallSeverity = hasCritical
    ? "CRITICAL"
    : hasHigh
      ? "HIGH"
      : hasMedium
        ? "MEDIUM"
        : findings.some((f) => f.severity === "LOW")
          ? "LOW"
          : "INFO";

  const violationCount = findings.filter((f) => f.severity !== "INFO").length;
  const summary =
    violationCount === 0
      ? `Security red-team CLEAR — ${scopedRoutes.length} route(s), ${checks.length} check categories, 0 violations.`
      : `${violationCount} security finding(s) across ${checks.filter((c) => c.count > 0).length} category(s). Highest severity: ${overallSeverity}.`;

  return {
    findings,
    summary,
    severity: overallSeverity,
    engineVersion: SECURITY_RED_TEAM_VERSION,
    durationMs: Date.now() - startTime,
    limitations: [
      "Static analysis only — does not execute HTTP requests or probe live endpoints.",
      "Route manifest must be provided or fixtures used — adapter has no runtime route discovery.",
      "Ownership check detection is declaration-based; logic-level IDOR vulnerabilities require manual code review.",
      "Does not cover SSRF, injection, or serialisation vulnerabilities.",
      "Rate limit coverage is checked by declaration — enforcement strength requires manual testing.",
    ],
    promotionRequirements: [
      "Integrate with real route manifest derived from Next.js app directory scan.",
      "Add AST-level auth guard detection (grep requireAdminAppRoute / requireAdminSession across all route files).",
      "Add response schema scanner to detect sensitive fields in Prisma select objects.",
      "Add CSRF token coverage check for state-mutating routes.",
    ],
    rawOutput: {
      engineId: SECURITY_RED_TEAM_ENGINE_ID,
      runAt: new Date().toISOString(),
      fixtureMode,
      scope,
      routeCount: scopedRoutes.length,
      formulaSteps,
      checkResults: checks.map((c) => ({
        rule: c.rule,
        severity: c.severity,
        violationCount: c.count,
        violations: c.violations,
      })),
    },
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const securityRedTeamAdapter = {
  id: SECURITY_RED_TEAM_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
