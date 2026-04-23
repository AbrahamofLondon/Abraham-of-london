import { prisma } from "@/lib/prisma.server";

export type ValidationStatus = "PASS" | "FAIL" | "INCOMPLETE";

export type ProductClass =
  | "executive_reporting"
  | "strategy_room"
  | "decision_instrument"
  | "gmi";

export type ValidationEntry = {
  id: string;
  productClass: ProductClass | "global";
  checkKey: string;
  status: ValidationStatus;
  evidence: string;
  note: string;
  createdAt: string;
  actorEmail: string | null;
};

export const PRODUCT_CLASSES: Array<{
  id: ProductClass;
  label: string;
  productCodes: string[];
}> = [
  {
    id: "executive_reporting",
    label: "Executive Reporting",
    productCodes: ["assessment.executive_reporting"],
  },
  {
    id: "strategy_room",
    label: "Strategy Room",
    productCodes: ["strategy-room.entry"],
  },
  {
    id: "decision_instrument",
    label: "Decision Instrument",
    productCodes: [
      "decision-exposure-instrument",
      "mandate-clarity-framework",
      "intervention-path-selector",
    ],
  },
  {
    id: "gmi",
    label: "GMI",
    productCodes: ["global-market-intelligence-report-q1-2026"],
  },
];

export const VALIDATION_CHECKS = [
  "payment",
  "return",
  "repeat_same_browser",
  "logged_out",
  "different_device",
  "db_entitlement",
  "admin_visible",
  "webhook_ok",
] as const;

const GLOBAL_CHECKS = [
  "stripe_webhook_routing",
  "fake_session_rejection",
  "failed_grant_recovery",
  "cancel_paths",
  "policy_consistency",
] as const;

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeStatus(value: unknown): ValidationStatus {
  return value === "PASS" || value === "FAIL" || value === "INCOMPLETE"
    ? value
    : "INCOMPLETE";
}

function serializeValidationEntry(row: {
  id: string;
  targetKey: string | null;
  reason: string | null;
  metadata: unknown;
  createdAt: Date;
  actorEmail: string | null;
}): ValidationEntry {
  const metadata = parseMetadata(row.metadata);
  const target = String(row.targetKey || "");
  const [productClassRaw, checkKeyRaw] = target.split(":");
  return {
    id: row.id,
    productClass: (metadata.productClass || productClassRaw || "global") as ValidationEntry["productClass"],
    checkKey: String(metadata.checkKey || checkKeyRaw || "unknown"),
    status: normalizeStatus(metadata.status || row.reason),
    evidence: String(metadata.evidence || ""),
    note: String(metadata.note || ""),
    createdAt: row.createdAt.toISOString(),
    actorEmail: row.actorEmail,
  };
}

function latestEntryMap(entries: ValidationEntry[]): Record<string, ValidationEntry> {
  const out: Record<string, ValidationEntry> = {};
  for (const entry of entries) {
    const key = `${entry.productClass}:${entry.checkKey}`;
    if (!out[key]) out[key] = entry;
  }
  return out;
}

function worstStatus(statuses: ValidationStatus[]): ValidationStatus {
  if (statuses.includes("FAIL")) return "FAIL";
  if (statuses.every((status) => status === "PASS")) return "PASS";
  return "INCOMPLETE";
}

export async function getCommercialValidationDashboard(email?: string | null) {
  const productCodes = PRODUCT_CLASSES.flatMap((product) => product.productCodes);
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);

  const [
    entitlements,
    failedGrants,
    checkoutAudits,
    validationRows,
    emailEntitlements,
  ] = await Promise.all([
    prisma.clientEntitlement.findMany({
      where: { productCode: { in: productCodes } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.failedEntitlementGrant.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.accessAuditLog.findMany({
      where: {
        action: "billing.checkout.completed",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.accessAuditLog.findMany({
      where: { action: "commercial.validation.entry" },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    email
      ? prisma.clientEntitlement.findMany({
          where: { email: email.toLowerCase() },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
  ]);

  const entries = validationRows.map(serializeValidationEntry);
  const latest = latestEntryMap(entries);

  const products = PRODUCT_CLASSES.map((product) => {
    const productEntitlements = entitlements.filter((row) =>
      product.productCodes.includes(row.productCode),
    );
    const activeEntitlements = productEntitlements.filter((row) => row.status === "active");
    const checkoutEvents = checkoutAudits.filter((row) => {
      const metadata = parseMetadata(row.metadata);
      return product.productCodes.includes(String(metadata.product || metadata.productCode || ""));
    });
    const unresolvedFailures = failedGrants.filter(
      (row) => !row.resolved && product.productCodes.includes(row.slug),
    );
    const checks = VALIDATION_CHECKS.map((check) => {
      const manual = latest[`${product.id}:${check}`];
      let liveStatus: ValidationStatus = "INCOMPLETE";
      let liveEvidence = "";

      if (check === "db_entitlement") {
        liveStatus = activeEntitlements.length > 0 ? "PASS" : "INCOMPLETE";
        liveEvidence = `${activeEntitlements.length} active ClientEntitlement row(s)`;
      }
      if (check === "webhook_ok") {
        liveStatus = checkoutEvents.some((event) => event.success) ? "PASS" : "INCOMPLETE";
        liveEvidence = `${checkoutEvents.length} checkout audit event(s) in last 14 days`;
      }
      if (check === "admin_visible") {
        liveStatus = productEntitlements.length > 0 || unresolvedFailures.length > 0 ? "PASS" : "INCOMPLETE";
        liveEvidence = `${productEntitlements.length} entitlement row(s), ${unresolvedFailures.length} unresolved failure(s)`;
      }
      if (unresolvedFailures.length > 0) {
        liveStatus = "FAIL";
        liveEvidence = `${unresolvedFailures.length} unresolved failed grant(s)`;
      }

      return {
        check,
        manualStatus: manual?.status ?? null,
        liveStatus,
        status: manual ? manual.status : liveStatus,
        evidence: manual?.evidence || liveEvidence,
        updatedAt: manual?.createdAt ?? null,
      };
    });

    const final = worstStatus(checks.map((check) => check.status));
    return {
      ...product,
      activeEntitlements: activeEntitlements.length,
      checkoutEvents: checkoutEvents.length,
      unresolvedFailures: unresolvedFailures.length,
      checks,
      final,
    };
  });

  const globalChecks = GLOBAL_CHECKS.map((check) => {
    const manual = latest[`global:${check}`];
    let liveStatus: ValidationStatus = "INCOMPLETE";
    let evidence = "";

    if (check === "failed_grant_recovery") {
      const unresolved = failedGrants.filter((row) => !row.resolved).length;
      liveStatus = unresolved === 0 ? "PASS" : "FAIL";
      evidence = `${unresolved} unresolved failed grant(s)`;
    }

    if (check === "stripe_webhook_routing") {
      liveStatus = checkoutAudits.length > 0 ? "INCOMPLETE" : "INCOMPLETE";
      evidence = "Requires live Stripe dashboard endpoint confirmation";
    }

    return {
      check,
      status: manual?.status ?? liveStatus,
      evidence: manual?.evidence || evidence,
      updatedAt: manual?.createdAt ?? null,
    };
  });

  const blockers = [
    ...products.flatMap((product) =>
      product.checks
        .filter((check) => check.status !== "PASS")
        .map((check) => `${product.label}: ${check.check} is ${check.status}`),
    ),
    ...globalChecks
      .filter((check) => check.status !== "PASS")
      .map((check) => `Global: ${check.check} is ${check.status}`),
  ];

  const launchStatus: ValidationStatus =
    blockers.some((blocker) => blocker.includes("FAIL"))
      ? "FAIL"
      : blockers.length === 0
        ? "PASS"
        : "INCOMPLETE";

  return {
    launchStatus,
    blockers,
    products,
    globalChecks,
    failedGrants: failedGrants.map((row) => ({
      id: row.id,
      email: row.email,
      slug: row.slug,
      source: row.source,
      error: row.error,
      resolved: row.resolved,
      createdAt: row.createdAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    })),
    recentCheckoutAudits: checkoutAudits.map((row) => ({
      id: row.id,
      email: row.actorEmail,
      targetKey: row.targetKey,
      success: row.success,
      reason: row.reason,
      metadata: parseMetadata(row.metadata),
      createdAt: row.createdAt.toISOString(),
    })),
    validationRunLog: entries.slice(0, 50),
    emailLookup: email
      ? {
          email,
          entitlements: emailEntitlements.map((row) => ({
            id: row.id,
            productCode: row.productCode,
            status: row.status,
            source: row.source,
            externalRef: row.externalRef,
            startsAt: row.startsAt.toISOString(),
            endsAt: row.endsAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
          })),
        }
      : null,
  };
}

export async function recordCommercialValidationEntry(input: {
  productClass: ProductClass | "global";
  checkKey: string;
  status: ValidationStatus;
  evidence: string;
  note?: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  return prisma.accessAuditLog.create({
    data: {
      actorType: "ADMIN",
      actorUserId: input.actorUserId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: "commercial.validation.entry",
      targetType: "commercial_validation",
      targetKey: `${input.productClass}:${input.checkKey}`,
      success: input.status === "PASS",
      reason: input.status,
      metadata: {
        productClass: input.productClass,
        checkKey: input.checkKey,
        status: input.status,
        evidence: input.evidence,
        note: input.note ?? "",
      } as any,
    },
  });
}
