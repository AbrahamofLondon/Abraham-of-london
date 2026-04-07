/* lib/reports/store.ts */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma.server";

export type ReportRequestStatus =
  | "pending_payment"
  | "paid"
  | "queued"
  | "in_progress"
  | "delivered"
  | "cancelled"
  | "failed";

export type ClientReportRequest = {
  id: string;
  reference: string;
  packageKey: string;
  title: string;
  diagnosticRecordId: string | null;
  diagnosticType: string | null;
  amountGbp: number;
  currency: string;
  status: ReportRequestStatus;
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  userId: string | null;
  userEmail: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  reportUrl: string | null;
  notes: string | null;
};

const MODEL_CANDIDATES = [
  "reportRequest",
  "diagnosticReportRequest",
  "clientReportRequest",
  "reportOrder",
] as const;

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function safeIsoDate(value: unknown): string | null {
  const raw = safeString(value);
  if (!raw) return null;
  const t = new Date(raw).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

function makeReference(prefix: string) {
  const stamp = new Date()
  .toISOString()
  .replace(/[-:.]/g, "")
  .replace(/T/g, "")
  .replace(/Z/g, "")
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

async function findSupportedModel() {
  const p = prisma as any;
  for (const name of MODEL_CANDIDATES) {
    if (p?.[name]) return p[name];
  }
  return null;
}

function mapRow(row: any): ClientReportRequest {
  return {
    id: safeString(row?.id),
    reference: safeString(row?.reference || row?.reportRef || row?.orderRef || row?.id),
    packageKey: safeString(row?.packageKey || row?.package || row?.reportType),
    title: safeString(row?.title || row?.reportTitle || "Report Request"),
    diagnosticRecordId: safeString(row?.diagnosticRecordId || row?.diagnosticId) || null,
    diagnosticType: safeString(row?.diagnosticType || row?.type) || null,
    amountGbp: safeNumber(row?.amountGbp ?? row?.amount ?? row?.price ?? 0),
    currency: safeString(row?.currency || "gbp"),
    status: safeString(row?.status || "pending_payment") as ReportRequestStatus,
    createdAt: safeIsoDate(row?.createdAt) || new Date().toISOString(),
    paidAt: safeIsoDate(row?.paidAt),
    deliveredAt: safeIsoDate(row?.deliveredAt),
    userId: safeString(row?.userId) || null,
    userEmail: safeString(row?.userEmail || row?.email) || null,
    stripeCheckoutSessionId: safeString(row?.stripeCheckoutSessionId || row?.checkoutSessionId) || null,
    stripePaymentIntentId: safeString(row?.stripePaymentIntentId || row?.paymentIntentId) || null,
    reportUrl: safeString(row?.reportUrl || row?.downloadUrl || row?.fileUrl) || null,
    notes: safeString(row?.notes || row?.internalNotes) || null,
  };
}

export async function createReportRequest(input: {
  packageKey: string;
  title: string;
  diagnosticRecordId?: string | null;
  diagnosticType?: string | null;
  amountGbp: number;
  currency?: string;
  userId?: string | null;
  userEmail?: string | null;
  notes?: string | null;
}) {
  const model = await findSupportedModel();
  if (!model?.create) {
    throw new Error("No supported report request model found in Prisma.");
  }

  const reference = makeReference("AOL-RPT");

  const row = await model.create({
    data: {
      reference,
      packageKey: input.packageKey,
      title: input.title,
      diagnosticRecordId: input.diagnosticRecordId || null,
      diagnosticType: input.diagnosticType || null,
      amountGbp: input.amountGbp,
      currency: input.currency || "gbp",
      status: "pending_payment",
      userId: input.userId || null,
      userEmail: input.userEmail || null,
      notes: input.notes || null,
    },
  });

  return mapRow(row);
}

export async function updateReportRequestById(
  id: string,
  patch: Record<string, unknown>,
): Promise<ClientReportRequest | null> {
  const model = await findSupportedModel();
  if (!model?.update) return null;

  const row = await model.update({
    where: { id },
    data: patch,
  });

  return mapRow(row);
}

export async function updateReportRequestByCheckoutSessionId(
  checkoutSessionId: string,
  patch: Record<string, unknown>,
): Promise<ClientReportRequest | null> {
  const model = await findSupportedModel();
  if (!model?.findFirst || !model?.update) return null;

  const existing = await model.findFirst({
    where: {
      OR: [
        { stripeCheckoutSessionId: checkoutSessionId },
        { checkoutSessionId },
      ],
    },
  });

  if (!existing?.id) return null;

  const row = await model.update({
    where: { id: existing.id },
    data: patch,
  });

  return mapRow(row);
}

export async function getReportRequestsForUser(input: {
  userId?: string | null;
  userEmail?: string | null;
  limit?: number;
}): Promise<ClientReportRequest[]> {
  const model = await findSupportedModel();
  if (!model?.findMany) return [];

  const or: any[] = [];
  if (input.userId) or.push({ userId: input.userId });
  if (input.userEmail) {
    or.push({ userEmail: input.userEmail });
    or.push({ email: input.userEmail });
  }
  if (or.length === 0) return [];

  const rows = await model.findMany({
    where: { OR: or },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(100, input.limit ?? 25)),
  });

  return (rows || []).map(mapRow);
}

export async function getRecentReportRequests(limit = 20): Promise<ClientReportRequest[]> {
  const model = await findSupportedModel();
  if (!model?.findMany) return [];

  const rows = await model.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(100, limit)),
  });

  return (rows || []).map(mapRow);
}

export async function attachCheckoutSession(
  id: string,
  input: {
    stripeCheckoutSessionId: string;
  },
): Promise<ClientReportRequest | null> {
  return updateReportRequestById(id, {
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
  });
}