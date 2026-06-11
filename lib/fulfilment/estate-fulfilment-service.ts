/**
 * lib/fulfilment/estate-fulfilment-service.ts
 *
 * Estate-wide product fulfilment spine.
 *
 * Collects fulfilment-requiring items from every product source,
 * normalises them into a single FulfilmentItem contract, and
 * computes next action, priority, and due/overdue status.
 *
 * Rules:
 * - Use existing models; do not add schema.
 * - Never expose PII in public-safe fields.
 * - Completed/archive items are excluded unless includeArchive: true.
 * - Returns stable JSON — safe for admin API serialisation.
 */

import { prisma } from "@/lib/prisma.server";

// ─── Contract ─────────────────────────────────────────────────────────────────

export type FulfilmentSourceType =
  | "boardroom_brief_order"
  | "product_artifact"
  | "executive_report"
  | "oversight_review_cycle"
  | "retainer_readiness"
  | "case_study"
  | "oversight_delivery";

export type FulfilmentPriority = "low" | "normal" | "high" | "critical";

export type FulfilmentItem = {
  id: string;
  sourceType: FulfilmentSourceType;
  sourceId: string;
  productCode: string;
  customerEmail: string | null;
  organisationId: string | null;
  paymentStatus: string | null;
  entitlementStatus: string | null;
  generationStatus: string | null;
  reviewStatus: string | null;
  deliveryStatus: string | null;
  proofStatus: string | null;
  priority: FulfilmentPriority;
  riskLevel: string | null;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  deliveredAt: string | null;
  nextAction: string;
  adminRoute: string;
  proofMode: boolean;
  isOverdue: boolean;
  publicSafe: boolean;
};

// ─── Options ──────────────────────────────────────────────────────────────────

export type FulfilmentQueryOptions = {
  includeArchive?: boolean;
  sourceTypes?: FulfilmentSourceType[];
  limit?: number;
};

// ─── Main entry ───────────────────────────────────────────────────────────────

export async function getEstateFulfilmentItems(
  opts: FulfilmentQueryOptions = {},
): Promise<FulfilmentItem[]> {
  const { includeArchive = false, sourceTypes, limit = 500 } = opts;

  const wantSource = (t: FulfilmentSourceType) =>
    !sourceTypes || sourceTypes.includes(t);

  const [
    boardroomOrders,
    productArtifacts,
    oversightCycles,
    retainerReadiness,
    caseStudies,
    oversightDeliveries,
  ] = await Promise.all([
    wantSource("boardroom_brief_order") ? fetchBoardroomOrders(includeArchive) : [],
    wantSource("product_artifact") ? fetchProductArtifacts(includeArchive) : [],
    wantSource("oversight_review_cycle") ? fetchOversightCycles(includeArchive) : [],
    wantSource("retainer_readiness") ? fetchRetainerReadiness(includeArchive) : [],
    wantSource("case_study") ? fetchCaseStudies(includeArchive) : [],
    wantSource("oversight_delivery") ? fetchOversightDeliveries(includeArchive) : [],
  ]);

  const all = [
    ...boardroomOrders,
    ...productArtifacts,
    ...oversightCycles,
    ...retainerReadiness,
    ...caseStudies,
    ...oversightDeliveries,
  ];

  // Sort: critical first, then high, then by createdAt desc
  const priorityWeight: Record<FulfilmentPriority, number> = {
    critical: 0, high: 1, normal: 2, low: 3,
  };
  all.sort((a, b) => {
    const pw = priorityWeight[a.priority] - priorityWeight[b.priority];
    if (pw !== 0) return pw;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return all.slice(0, limit);
}

// ─── Source: BoardroomBriefOrder ──────────────────────────────────────────────

async function fetchBoardroomOrders(includeArchive: boolean): Promise<FulfilmentItem[]> {
  const where = includeArchive
    ? {}
    : { NOT: { deliveryStatus: "delivered" } };

  const orders = await prisma.boardroomBriefOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      paymentStatus: true,
      deliveryStatus: true,
      riskLevel: true,
      createdAt: true,
      updatedAt: true,
      deliveredAt: true,
      metadata: true,
    },
  });

  return orders.map((o) => {
    const meta = (o.metadata as Record<string, unknown> | null) ?? {};
    const proofMode = meta.proofMode === "true" || meta.proofMode === true;
    const dueAt = new Date(o.createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString();
    const isOverdue = o.deliveryStatus !== "delivered" && new Date(dueAt) < new Date();

    return {
      id: `bb_${o.id}`,
      sourceType: "boardroom_brief_order" as const,
      sourceId: o.id,
      productCode: "boardroom-brief",
      customerEmail: o.email,
      organisationId: null,
      paymentStatus: o.paymentStatus,
      entitlementStatus: null,
      generationStatus: o.deliveryStatus === "dossier_generated" ? "generated" : "pending",
      reviewStatus: o.deliveryStatus === "in_review" ? "in_review" : null,
      deliveryStatus: o.deliveryStatus,
      proofStatus: proofMode ? "proof_run" : null,
      priority: computeBoardroomPriority(o.paymentStatus, o.deliveryStatus, isOverdue),
      riskLevel: o.riskLevel,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      dueAt,
      deliveredAt: o.deliveredAt?.toISOString() ?? null,
      nextAction: boardroomNextAction(o.deliveryStatus),
      adminRoute: `/admin/boardroom/orders/${o.id}`,
      proofMode,
      isOverdue,
      publicSafe: false,
    };
  });
}

function computeBoardroomPriority(
  paymentStatus: string,
  deliveryStatus: string,
  isOverdue: boolean,
): FulfilmentPriority {
  if (isOverdue) return "critical";
  if (paymentStatus === "paid" && (deliveryStatus === "requested" || deliveryStatus === "paid")) return "high";
  if (deliveryStatus === "in_review" || deliveryStatus === "dossier_generated") return "normal";
  return "low";
}

function boardroomNextAction(deliveryStatus: string): string {
  switch (deliveryStatus) {
    case "requested":
    case "paid": return "Start review";
    case "in_review": return "Generate dossier";
    case "dossier_generated": return "Deliver to client";
    case "delivered": return "Delivered";
    case "follow_up_due": return "Follow-up due";
    default: return "Review status";
  }
}

// ─── Source: ProductArtifact ──────────────────────────────────────────────────

async function fetchProductArtifacts(includeArchive: boolean): Promise<FulfilmentItem[]> {
  const excludedDelivery = includeArchive ? [] : ["DELIVERED"];
  const excludedStatus = includeArchive ? [] : ["SUPERSEDED"];

  const artifacts = await prisma.productArtifact.findMany({
    where: {
      ...(excludedDelivery.length ? { deliveryStatus: { notIn: excludedDelivery } } : {}),
      ...(excludedStatus.length ? { status: { notIn: excludedStatus } } : {}),
      // Exclude boardroom stubs — they surface via BoardroomBriefOrder
      sourceEntityType: { not: "boardroom_brief_order" },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      artifactId: true,
      productCode: true,
      sourceEntityType: true,
      sourceEntityId: true,
      userEmail: true,
      organisationId: true,
      status: true,
      deliveryStatus: true,
      generatedBy: true,
      createdAt: true,
      updatedAt: true,
      deliveredAt: true,
    },
  });

  return artifacts.map((a) => {
    const isDelivered = a.deliveryStatus === "DELIVERED";
    const isGenerating = a.status === "GENERATING";
    const isStuck = isGenerating && new Date().getTime() - a.createdAt.getTime() > 30 * 60 * 1000;

    return {
      id: `pa_${a.id}`,
      sourceType: "product_artifact" as const,
      sourceId: a.id,
      productCode: a.productCode,
      customerEmail: a.userEmail ?? null,
      organisationId: a.organisationId ?? null,
      paymentStatus: null,
      entitlementStatus: null,
      generationStatus: a.status,
      reviewStatus: null,
      deliveryStatus: a.deliveryStatus,
      proofStatus: null,
      priority: isStuck ? "high" : isGenerating ? "normal" : isDelivered ? "low" : "normal",
      riskLevel: null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      dueAt: null,
      deliveredAt: a.deliveredAt?.toISOString() ?? null,
      nextAction: artifactNextAction(a.status, a.deliveryStatus, isStuck),
      adminRoute: `/admin/artifacts`,
      proofMode: false,
      isOverdue: false,
      publicSafe: false,
    };
  });
}

function artifactNextAction(status: string, deliveryStatus: string, isStuck: boolean): string {
  if (isStuck) return "Check stuck generation";
  if (status === "GENERATING") return "Awaiting generation";
  if (deliveryStatus === "PENDING") return "Approve for delivery";
  if (deliveryStatus === "DELIVERED") return "Delivered";
  return "Inspect artifact";
}

// ─── Source: OversightReviewCycle ────────────────────────────────────────────

async function fetchOversightCycles(includeArchive: boolean): Promise<FulfilmentItem[]> {
  const cycles = await prisma.oversightReviewCycle.findMany({
    where: includeArchive ? {} : { status: { in: ["OPEN", "UNDER_REVIEW"] } },
    orderBy: { periodStart: "desc" },
    take: 100,
    select: {
      id: true,
      contractId: true,
      cycleNumber: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      clientHealthStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return cycles.map((c) => {
    const isOverdue = c.status !== "COMPLETED" && c.status !== "SKIPPED" && new Date(c.periodEnd) < new Date();

    return {
      id: `orc_${c.id}`,
      sourceType: "oversight_review_cycle" as const,
      sourceId: c.id,
      productCode: "retainer_core",
      customerEmail: null,
      organisationId: null,
      paymentStatus: null,
      entitlementStatus: null,
      generationStatus: null,
      reviewStatus: c.status,
      deliveryStatus: null,
      proofStatus: null,
      priority: isOverdue ? "high" : c.status === "UNDER_REVIEW" ? "normal" : "low",
      riskLevel: c.clientHealthStatus === "CRITICAL" ? "Critical" : c.clientHealthStatus === "DETERIORATING" ? "High" : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      dueAt: c.periodEnd.toISOString(),
      deliveredAt: null,
      nextAction: c.status === "OPEN" ? "Review cycle" : c.status === "UNDER_REVIEW" ? "Complete review" : "Reviewed",
      adminRoute: `/admin/retainers`,
      proofMode: false,
      isOverdue,
      publicSafe: false,
    };
  });
}

// ─── Source: RetainerReadinessEvaluation ─────────────────────────────────────

async function fetchRetainerReadiness(includeArchive: boolean): Promise<FulfilmentItem[]> {
  const evals = await prisma.retainerReadinessEvaluation.findMany({
    where: includeArchive
      ? {}
      : { readinessClass: { in: ["CANDIDATE", "REVIEW_READY"] }, adminApprovedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      organisationId: true,
      userEmail: true,
      readinessClass: true,
      overallReadinessScore: true,
      adminApprovalRequired: true,
      adminApprovedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return evals.map((e) => ({
    id: `rre_${e.id}`,
    sourceType: "retainer_readiness" as const,
    sourceId: e.id,
    productCode: "retainer_core",
    customerEmail: e.userEmail ?? null,
    organisationId: e.organisationId ?? null,
    paymentStatus: null,
    entitlementStatus: null,
    generationStatus: null,
    reviewStatus: e.readinessClass,
    deliveryStatus: e.adminApprovedAt ? "approved" : "pending",
    proofStatus: null,
    priority: e.readinessClass === "REVIEW_READY" ? "high" : "normal",
    riskLevel: null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    dueAt: null,
    deliveredAt: null,
    nextAction: e.readinessClass === "REVIEW_READY" ? "Approve offer" : "Review candidate",
    adminRoute: `/admin/retainer-readiness`,
    proofMode: false,
    isOverdue: false,
    publicSafe: false,
  }));
}

// ─── Source: CaseStudy ────────────────────────────────────────────────────────

async function fetchCaseStudies(includeArchive: boolean): Promise<FulfilmentItem[]> {
  const studies = await prisma.caseStudy.findMany({
    where: includeArchive
      ? {}
      : { status: { in: ["DRAFT", "REVIEW"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      status: true,
      consentStatus: true,
      verificationStatus: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
    },
  });

  return studies.map((cs) => ({
    id: `cs_${cs.id}`,
    sourceType: "case_study" as const,
    sourceId: cs.id,
    productCode: "case_study",
    customerEmail: null,
    organisationId: null,
    paymentStatus: null,
    entitlementStatus: null,
    generationStatus: null,
    reviewStatus: cs.status,
    deliveryStatus: cs.publishedAt ? "published" : null,
    proofStatus: null,
    priority: cs.status === "REVIEW" ? "normal" : "low",
    riskLevel: null,
    createdAt: cs.createdAt.toISOString(),
    updatedAt: cs.updatedAt.toISOString(),
    dueAt: null,
    deliveredAt: cs.publishedAt?.toISOString() ?? null,
    nextAction: caseStudyNextAction(cs.status, cs.consentStatus),
    adminRoute: `/admin/case-studies`,
    proofMode: false,
    isOverdue: false,
    publicSafe: false,
  }));
}

function caseStudyNextAction(status: string, consentStatus: string): string {
  if (status === "DRAFT") return "Review draft";
  if (status === "REVIEW") {
    if (consentStatus === "PENDING") return "Request consent";
    if (consentStatus === "GRANTED") return "Approve for publication";
    return "Review consent";
  }
  if (status === "APPROVED") return "Publish";
  if (status === "PUBLISHED") return "Published";
  return "Review";
}

// ─── Source: OversightDelivery (AuditEvent-backed) ───────────────────────────

async function fetchOversightDeliveries(includeArchive: boolean): Promise<FulfilmentItem[]> {
  try {
    const events = await prisma.auditEvent.findMany({
      where: {
        objectType: "OVERSIGHT_DELIVERY",
        ...(includeArchive ? {} : {
          metadata: {
            path: ["status"],
            not: "DELIVERED",
          },
        }),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        objectId: true,
        metadata: true,
        createdAt: true,
      },
    });

    return events.map((e) => {
      const meta = (e.metadata as Record<string, unknown>) ?? {};
      const status = String(meta.status ?? "QUEUED");
      const email = typeof meta.recipientEmail === "string" ? meta.recipientEmail : null;

      return {
        id: `od_${e.id}`,
        sourceType: "oversight_delivery" as const,
        sourceId: e.id,
        productCode: "oversight_brief",
        customerEmail: email,
        organisationId: null,
        paymentStatus: null,
        entitlementStatus: null,
        generationStatus: null,
        reviewStatus: null,
        deliveryStatus: status,
        proofStatus: null,
        priority: status === "FAILED" ? "high" : status === "QUEUED" ? "normal" : "low",
        riskLevel: null,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.createdAt.toISOString(),
        dueAt: null,
        deliveredAt: typeof meta.deliveredAt === "string" ? meta.deliveredAt : null,
        nextAction: status === "QUEUED" ? "Approve delivery" : status === "APPROVED" ? "Send" : status === "FAILED" ? "Retry" : "Delivered",
        adminRoute: `/admin/delivery-queue`,
        proofMode: false,
        isOverdue: false,
        publicSafe: false,
      };
    });
  } catch {
    // AuditEvent metadata JSON path filter may not be supported in all Prisma versions
    return [];
  }
}
