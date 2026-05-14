/**
 * lib/admin/report-state-dashboard.ts
 *
 * Unified report state dashboard — single source of truth for report operations.
 * Aggregates data from delivery queue, PDF status, executive reports, and oversight briefs.
 *
 * Each section fails independently. If a data source is unavailable, its section
 * shows "Unavailable" rather than zero.
 */

import type { DeliveryRecord } from "@/lib/product/delivery-audit-contract";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ReportStateMetricTone = "neutral" | "attention" | "risk" | "good";

export type ReportStateMetric = {
  label: string;
  value: number | null;
  detail?: string | null;
  tone?: ReportStateMetricTone;
};

export type ReportStateSectionStatus = "available" | "unavailable";

export type ReportStateSection = {
  id: string;
  title: string;
  description: string;
  status: ReportStateSectionStatus;
  metrics: ReportStateMetric[];
  actions: Array<{
    label: string;
    href: string;
    description: string;
  }>;
  note?: string | null;
};

export type ReportStateDashboard = {
  generatedAt: string;
  sections: ReportStateSection[];
};

// ─── Loader types ──────────────────────────────────────────────────────────

export type ReportStateLoaders = {
  loadDeliveries?: () => Promise<DeliveryRecord[]>;
  loadPdfStatus?: () => Promise<{
    total: number;
    existing: number;
    missing: number;
  }>;
  loadExecutiveReportCount?: () => Promise<number>;
  loadOversightBriefCount?: () => Promise<number>;
};

// ─── Default loaders ───────────────────────────────────────────────────────

async function defaultLoadDeliveries(): Promise<DeliveryRecord[]> {
  const { listAllDeliveries } = await import("@/lib/product/oversight-delivery-service");
  return listAllDeliveries();
}

async function defaultLoadPdfStatus(): Promise<{
  total: number;
  existing: number;
  missing: number;
}> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const publicDir = path.default.join(process.cwd(), "public");
    const files = await fs.default.readdir(publicDir).catch(() => []);
    const pdfs = files.filter((f: string) => f.endsWith(".pdf"));
    return {
      total: pdfs.length,
      existing: pdfs.length,
      missing: 0,
    };
  } catch {
    return { total: 0, existing: 0, missing: 0 };
  }
}

async function defaultLoadExecutiveReportCount(): Promise<number> {
  try {
    const { prisma } = await import("@/lib/prisma.server");
    const count = await prisma.executiveReportingRun.count().catch(() => 0);
    return count;
  } catch {
    return 0;
  }
}

async function defaultLoadOversightBriefCount(): Promise<number> {
  try {
    const { prisma } = await import("@/lib/prisma.server");
    const count = await prisma.auditEvent.count({
      where: { objectType: "OVERSIGHT_ARCHIVE" },
    }).catch(() => 0);
    return count;
  } catch {
    return 0;
  }
}

// ─── Build dashboard ───────────────────────────────────────────────────────

export async function buildReportStateDashboard(
  loaders?: ReportStateLoaders,
): Promise<ReportStateDashboard> {
  const l = {
    loadDeliveries: loaders?.loadDeliveries ?? defaultLoadDeliveries,
    loadPdfStatus: loaders?.loadPdfStatus ?? defaultLoadPdfStatus,
    loadExecutiveReportCount: loaders?.loadExecutiveReportCount ?? defaultLoadExecutiveReportCount,
    loadOversightBriefCount: loaders?.loadOversightBriefCount ?? defaultLoadOversightBriefCount,
  };

  // ── Section 1: Report production state ──
  let productionSection: ReportStateSection;
  try {
    const executiveCount = await l.loadExecutiveReportCount();
    const oversightCount = await l.loadOversightBriefCount();
    const totalReports = executiveCount + oversightCount;

    productionSection = {
      id: "report-production",
      title: "Report Production State",
      description: "Generated reports across all report types.",
      status: "available",
      metrics: [
        {
          label: "Total reports",
          value: totalReports,
          detail: "All report types",
          tone: totalReports > 0 ? "good" : "neutral",
        },
        {
          label: "Executive reports",
          value: executiveCount,
          detail: "Generated executive intelligence briefs",
          tone: executiveCount > 0 ? "good" : "neutral",
        },
        {
          label: "Oversight briefs",
          value: oversightCount,
          detail: "Archived oversight cycle briefs",
          tone: oversightCount > 0 ? "good" : "neutral",
        },
      ],
      actions: [
        { label: "View executive reports", href: "/admin/reporting/executive", description: "Executive intelligence briefs" },
        { label: "View reports index", href: "/admin/reports", description: "Campaign-based report registry" },
      ],
    };
  } catch {
    productionSection = {
      id: "report-production",
      title: "Report Production State",
      description: "Generated reports across all report types.",
      status: "unavailable",
      metrics: [
        { label: "Total reports", value: null, detail: "Unavailable", tone: "neutral" },
        { label: "Executive reports", value: null, detail: "Unavailable", tone: "neutral" },
        { label: "Oversight briefs", value: null, detail: "Unavailable", tone: "neutral" },
      ],
      actions: [
        { label: "View executive reports", href: "/admin/reporting/executive", description: "Executive intelligence briefs" },
        { label: "View reports index", href: "/admin/reports", description: "Campaign-based report registry" },
      ],
      note: "Report production data source is not responding.",
    };
  }

  // ── Section 2: Delivery state ──
  let deliverySection: ReportStateSection;
  try {
    const deliveries = await l.loadDeliveries();
    const pendingApproval = deliveries.filter(
      (d) => d.status === "QUEUED" || d.status === "TRANSPORT_PENDING",
    ).length;
    const sent = deliveries.filter((d) => d.status === "DELIVERED").length;
    const failed = deliveries.filter((d) => d.status === "FAILED").length;
    const suppressed = deliveries.filter((d) => !d.clientSafe).length;
    const safeToApprove = deliveries.filter(
      (d) => d.clientSafe && (d.status === "QUEUED" || d.status === "TRANSPORT_PENDING"),
    ).length;

    deliverySection = {
      id: "delivery-state",
      title: "Delivery State",
      description: "Oversight brief and proof pack delivery status.",
      status: "available",
      metrics: [
        {
          label: "Pending approval/send",
          value: pendingApproval,
          detail: pendingApproval > 0 ? "Requires operator action" : "No pending deliveries",
          tone: pendingApproval > 0 ? "attention" : "good",
        },
        {
          label: "Sent",
          value: sent,
          detail: "Successfully delivered",
          tone: sent > 0 ? "good" : "neutral",
        },
        {
          label: "Failed",
          value: failed,
          detail: failed > 0 ? "Requires investigation" : "No failures",
          tone: failed > 0 ? "risk" : "good",
        },
        {
          label: "Suppressed",
          value: suppressed,
          detail: "Not client-safe",
          tone: suppressed > 0 ? "attention" : "neutral",
        },
        {
          label: "Safe to approve",
          value: safeToApprove,
          detail: "Client-safe and awaiting action",
          tone: safeToApprove > 0 ? "good" : "neutral",
        },
      ],
      actions: [
        { label: "Review delivery queue", href: "/admin/delivery-queue", description: "Approve, fail, or send deliveries" },
        { label: "View suppression ledger", href: "/admin/suppression-ledger", description: "Audit suppression decisions" },
      ],
    };
  } catch {
    deliverySection = {
      id: "delivery-state",
      title: "Delivery State",
      description: "Oversight brief and proof pack delivery status.",
      status: "unavailable",
      metrics: [
        { label: "Pending approval/send", value: null, detail: "Unavailable", tone: "neutral" },
        { label: "Sent", value: null, detail: "Unavailable", tone: "neutral" },
        { label: "Failed", value: null, detail: "Unavailable", tone: "neutral" },
        { label: "Suppressed", value: null, detail: "Unavailable", tone: "neutral" },
        { label: "Safe to approve", value: null, detail: "Unavailable", tone: "neutral" },
      ],
      actions: [
        { label: "Review delivery queue", href: "/admin/delivery-queue", description: "Approve, fail, or send deliveries" },
      ],
      note: "Delivery data source is not responding.",
    };
  }

  // ── Section 3: PDF/export state ──
  let pdfSection: ReportStateSection;
  try {
    const pdfStatus = await l.loadPdfStatus();
    const healthPct =
      pdfStatus.total > 0
        ? Math.round((pdfStatus.existing / pdfStatus.total) * 100)
        : null;

    pdfSection = {
      id: "pdf-export-state",
      title: "PDF & Export State",
      description: "Canonical binary health and file system integrity.",
      status: "available",
      metrics: [
        {
          label: "Total PDFs",
          value: pdfStatus.total,
          detail: "Files in public directory",
          tone: pdfStatus.total > 0 ? "good" : "neutral",
        },
        {
          label: "Present",
          value: pdfStatus.existing,
          detail: healthPct !== null ? `${healthPct}% healthy` : "No data",
          tone: healthPct !== null && healthPct >= 90 ? "good" : healthPct !== null && healthPct >= 50 ? "attention" : "neutral",
        },
        {
          label: "Missing",
          value: pdfStatus.missing,
          detail: pdfStatus.missing > 0 ? "Requires investigation" : "All accounted for",
          tone: pdfStatus.missing > 0 ? "risk" : "good",
        },
      ],
      actions: [
        { label: "PDF analytics dashboard", href: "/admin/pdf-dashboard", description: "PDF intelligence registry and metrics" },
        { label: "PDF status scan", href: "/admin/pdf-status", description: "Filesystem verification" },
      ],
    };
  } catch {
    pdfSection = {
      id: "pdf-export-state",
      title: "PDF & Export State",
      description: "Canonical binary health and file system integrity.",
      status: "unavailable",
      metrics: [
        { label: "Total PDFs", value: null, detail: "Unavailable", tone: "neutral" },
        { label: "Present", value: null, detail: "Unavailable", tone: "neutral" },
        { label: "Missing", value: null, detail: "Unavailable", tone: "neutral" },
      ],
      actions: [
        { label: "PDF analytics dashboard", href: "/admin/pdf-dashboard", description: "PDF intelligence registry" },
        { label: "PDF status scan", href: "/admin/pdf-status", description: "Filesystem verification" },
      ],
      note: "PDF status data source is not responding.",
    };
  }

  // ── Section 4: Executive reports summary ──
  let executiveSection: ReportStateSection;
  try {
    const executiveCount = await l.loadExecutiveReportCount();

    executiveSection = {
      id: "executive-reports",
      title: "Executive Reports",
      description: "Executive intelligence briefs generated from diagnostic evidence.",
      status: "available",
      metrics: [
        {
          label: "Reports generated",
          value: executiveCount,
          detail: "Total executive intelligence briefs",
          tone: executiveCount > 0 ? "good" : "neutral",
        },
      ],
      actions: [
        { label: "Executive reports hub", href: "/admin/reporting/executive", description: "Governance hub for intelligence briefs" },
        { label: "Reports index", href: "/admin/reports", description: "Campaign-based report registry" },
      ],
    };
  } catch {
    executiveSection = {
      id: "executive-reports",
      title: "Executive Reports",
      description: "Executive intelligence briefs generated from diagnostic evidence.",
      status: "unavailable",
      metrics: [
        { label: "Reports generated", value: null, detail: "Unavailable", tone: "neutral" },
      ],
      actions: [
        { label: "Executive reports hub", href: "/admin/reporting/executive", description: "Governance hub for intelligence briefs" },
      ],
      note: "Executive report data source is not responding.",
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    sections: [productionSection, deliverySection, pdfSection, executiveSection],
  };
}
