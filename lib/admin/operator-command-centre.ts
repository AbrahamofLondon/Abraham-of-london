import type { DeliveryRecord } from "@/lib/product/delivery-audit-contract";
import type { ReviewQueuePosture } from "@/lib/product/operator-outcome-review";
import type { SuppressionEvent } from "@/lib/product/suppression-ledger-contract";

type CadenceQueue = Awaited<
  ReturnType<typeof import("@/lib/product/retained-cadence-service").buildOperatorCadenceQueue>
>;

type CadenceQueueItem = CadenceQueue["all"][number];

export type OperatorMetricTone = "neutral" | "attention" | "risk" | "good";

export type OperatorMetric = {
  label: string;
  value: number | null;
  detail?: string | null;
  tone?: OperatorMetricTone;
};

export type OperatorQueueCard = {
  id:
    | "oversight-reviews"
    | "retained-cadence"
    | "delivery-queue"
    | "suppression-ledger"
    | "outcome-verification"
    | "retainer-readiness";
  title: string;
  href: string;
  description: string;
  status: "available" | "unavailable";
  metrics: OperatorMetric[];
  note?: string | null;
  priority: "normal" | "attention" | "risk";
};

export type OperatorHeadline = {
  label: string;
  value: number | null;
  detail: string;
  tone: OperatorMetricTone;
};

export type OperatorCommandCentreSummary = {
  generatedAt: string;
  headlines: OperatorHeadline[];
  cards: OperatorQueueCard[];
};

export type OperatorCommandCentreLoaders = {
  loadCadenceQueue?: () => Promise<CadenceQueue>;
  loadDeliveries?: () => Promise<DeliveryRecord[]>;
  loadSuppressions?: () => Promise<SuppressionEvent[]>;
  loadOutcomePosture?: () => Promise<ReviewQueuePosture>;
};

async function defaultLoadCadenceQueue(): Promise<CadenceQueue> {
  const { buildOperatorCadenceQueue } = await import("@/lib/product/retained-cadence-service");
  return buildOperatorCadenceQueue();
}

async function defaultLoadDeliveries(): Promise<DeliveryRecord[]> {
  const { listAllDeliveries } = await import("@/lib/product/oversight-delivery-service");
  return listAllDeliveries();
}

async function defaultLoadSuppressions(): Promise<SuppressionEvent[]> {
  const { loadSuppressionLedger } = await import("@/lib/product/suppression-ledger");
  return loadSuppressionLedger({ limit: 500 });
}

async function defaultLoadOutcomePosture(): Promise<ReviewQueuePosture> {
  const { getOperatorReviewQueuePosture } = await import("@/lib/product/operator-outcome-review");
  return getOperatorReviewQueuePosture();
}

async function safeLoad<T>(loader: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
  try {
    return { ok: true, value: await loader() };
  } catch {
    return { ok: false };
  }
}

function metric(
  label: string,
  value: number | null,
  detail?: string | null,
  tone: OperatorMetricTone = "neutral",
): OperatorMetric {
  return { label, value, detail: detail ?? null, tone };
}

function unavailableCard(
  card: Pick<OperatorQueueCard, "id" | "title" | "href" | "description">,
  labels: string[],
): OperatorQueueCard {
  return {
    ...card,
    status: "unavailable",
    priority: "normal",
    metrics: labels.map((label) => metric(label, null, "Unavailable")),
    note: "Not yet connected",
  };
}

function isDueThisWeek(item: CadenceQueueItem, now: Date): boolean {
  if (!item.scheduledFor) return false;
  const scheduled = new Date(item.scheduledFor);
  if (Number.isNaN(scheduled.getTime())) return false;
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);
  return scheduled >= now && scheduled <= sevenDays;
}

function nextDueLabel(items: CadenceQueueItem[]): string | null {
  const next = items
    .filter((item) => item.scheduledFor)
    .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())[0];

  if (!next?.scheduledFor) return null;
  const label = next.organisationLabel || next.organisationId || next.accountId || "Unscoped";
  return `${label} · ${new Date(next.scheduledFor).toLocaleDateString("en-GB")}`;
}

async function buildOversightReviewCard(
  loaders: Required<Pick<OperatorCommandCentreLoaders, "loadSuppressions">>,
): Promise<OperatorQueueCard> {
  const base = {
    id: "oversight-reviews" as const,
    title: "Oversight reviews",
    href: "/admin/oversight-review",
    description: "Governed review bench for client-safe oversight output and operator decisions.",
  };
  const suppressions = await safeLoad(loaders.loadSuppressions);
  if (!suppressions.ok) return unavailableCard(base, ["Pending", "Suppressed"]);

  const reviewableSuppressions = suppressions.value.filter(
    (event) => event.operatorReviewAvailable !== false && event.overrideStatus === "NONE",
  ).length;

  return {
    ...base,
    status: "available",
    priority: reviewableSuppressions > 0 ? "attention" : "normal",
    metrics: [
      metric("Pending", null, "Not yet connected"),
      metric("Suppressed", reviewableSuppressions, "Reviewable suppressions", reviewableSuppressions > 0 ? "attention" : "neutral"),
    ],
    note: "The review bench is available; a persisted pending-review queue is not yet connected.",
  };
}

async function buildRetainedCadenceCard(
  loaders: Required<Pick<OperatorCommandCentreLoaders, "loadCadenceQueue">>,
  now: Date,
): Promise<OperatorQueueCard> {
  const base = {
    id: "retained-cadence" as const,
    title: "Retained cadence",
    href: "/admin/retained-cadence",
    description: "Due, overdue, broken, and escalated retained review cycles.",
  };
  const queue = await safeLoad(loaders.loadCadenceQueue);
  if (!queue.ok) return unavailableCard(base, ["Due this week", "Overdue", "Next due"]);

  const dueThisWeek = queue.value.due.filter((item) => isDueThisWeek(item, now)).length;
  const overdue = queue.value.overdue.length + queue.value.cadenceBroken.length;
  const nextDue = nextDueLabel(queue.value.due);

  return {
    ...base,
    status: "available",
    priority: overdue > 0 ? "risk" : dueThisWeek > 0 ? "attention" : "normal",
    metrics: [
      metric("Due this week", dueThisWeek, dueThisWeek === 0 ? "No pending items" : null, dueThisWeek > 0 ? "attention" : "good"),
      metric("Overdue", overdue, overdue === 0 ? "No pending items" : null, overdue > 0 ? "risk" : "good"),
      metric("Next due", nextDue ? 1 : null, nextDue ?? "Unavailable"),
    ],
    note: nextDue ? `Next cycle: ${nextDue}` : "No scheduled due cycle found.",
  };
}

async function buildDeliveryQueueCard(
  loaders: Required<Pick<OperatorCommandCentreLoaders, "loadDeliveries">>,
): Promise<OperatorQueueCard> {
  const base = {
    id: "delivery-queue" as const,
    title: "Delivery queue",
    href: "/admin/delivery-queue",
    description: "Client-safe delivery items awaiting approval, send, or failure review.",
  };
  const deliveries = await safeLoad(loaders.loadDeliveries);
  if (!deliveries.ok) return unavailableCard(base, ["Pending approval/send", "Failed", "Safe to approve"]);

  const pending = deliveries.value.filter((item) =>
    item.status === "QUEUED" || item.status === "APPROVED" || item.status === "TRANSPORT_PENDING"
  ).length;
  const failed = deliveries.value.filter((item) => item.status === "FAILED").length;
  const safeToApprove = deliveries.value.filter((item) =>
    item.clientSafe && (item.status === "QUEUED" || item.status === "TRANSPORT_PENDING")
  ).length;

  return {
    ...base,
    status: "available",
    priority: failed > 0 ? "risk" : pending > 0 ? "attention" : "normal",
    metrics: [
      metric("Pending approval/send", pending, pending === 0 ? "No pending items" : null, pending > 0 ? "attention" : "good"),
      metric("Failed", failed, failed === 0 ? "No pending items" : null, failed > 0 ? "risk" : "good"),
      metric("Safe to approve", safeToApprove, safeToApprove === 0 ? "No pending items" : null, safeToApprove > 0 ? "attention" : "good"),
    ],
  };
}

async function buildSuppressionLedgerCard(
  loaders: Required<Pick<OperatorCommandCentreLoaders, "loadSuppressions">>,
): Promise<OperatorQueueCard> {
  const base = {
    id: "suppression-ledger" as const,
    title: "Suppression ledger",
    href: "/admin/suppression-ledger",
    description: "Audit trail for withheld or sponsor-unsafe fields, with operator overrides.",
  };
  const suppressions = await safeLoad(loaders.loadSuppressions);
  if (!suppressions.ok) return unavailableCard(base, ["Unresolved", "High-risk"]);

  const unresolved = suppressions.value.filter((event) =>
    event.operatorReviewAvailable !== false && event.overrideStatus === "NONE"
  ).length;
  const highRisk = suppressions.value.filter((event) =>
    event.operatorReviewAvailable !== false
    && event.overrideStatus === "NONE"
    && /privacy|legal|counsel|risk|unsafe/i.test(`${event.suppressionRule} ${event.suppressionReason}`)
  ).length;

  return {
    ...base,
    status: "available",
    priority: highRisk > 0 ? "risk" : unresolved > 0 ? "attention" : "normal",
    metrics: [
      metric("Unresolved", unresolved, unresolved === 0 ? "No pending items" : null, unresolved > 0 ? "attention" : "good"),
      metric("High-risk", highRisk, highRisk === 0 ? "No pending items" : null, highRisk > 0 ? "risk" : "good"),
    ],
  };
}

async function buildOutcomeVerificationCard(
  loaders: Required<Pick<OperatorCommandCentreLoaders, "loadOutcomePosture">>,
): Promise<OperatorQueueCard> {
  const base = {
    id: "outcome-verification" as const,
    title: "Outcome verification",
    href: "/admin/outcome-verification",
    description: "Operator review queue for disputed, blocked, and insufficient-evidence outcomes.",
  };
  const posture = await safeLoad(loaders.loadOutcomePosture);
  if (!posture.ok) return unavailableCard(base, ["Pending", "Overdue", "Critical"]);

  const riskCount = posture.value.overdueReviewCount + posture.value.criticalPendingCount;

  return {
    ...base,
    status: "available",
    priority: posture.value.reviewSlaBand === "CRITICAL" || posture.value.reviewSlaBand === "RED" ? "risk" : posture.value.pendingCount > 0 ? "attention" : "normal",
    metrics: [
      metric("Pending", posture.value.pendingCount, posture.value.pendingCount === 0 ? "No pending items" : null, posture.value.pendingCount > 0 ? "attention" : "good"),
      metric("Overdue", posture.value.overdueReviewCount, posture.value.overdueReviewCount === 0 ? "No pending items" : null, posture.value.overdueReviewCount > 0 ? "risk" : "good"),
      metric("Critical", posture.value.criticalPendingCount, `SLA ${posture.value.reviewSlaBand}`, posture.value.criticalPendingCount > 0 ? "risk" : "neutral"),
    ],
    note: `SLA band: ${posture.value.reviewSlaBand}. Oldest pending age: ${posture.value.oldestPendingAge} days.`,
  };
}

async function buildRetainerReadinessCard(
  loaders: Required<Pick<OperatorCommandCentreLoaders, "loadCadenceQueue">>,
): Promise<OperatorQueueCard> {
  const base = {
    id: "retainer-readiness" as const,
    title: "Retainer readiness",
    href: "/admin/retainer-readiness",
    description: "Runtime readiness warnings for retained oversight accounts and cadence coverage.",
  };
  const queue = await safeLoad(loaders.loadCadenceQueue);
  if (!queue.ok) return unavailableCard(base, ["Accounts not ready", "Readiness warnings"]);

  const accountsNotReady = queue.value.notConfigured.length;
  const readinessWarnings =
    queue.value.notConfigured.length
    + queue.value.overdue.length
    + queue.value.escalated.length
    + queue.value.cadenceBroken.length;

  return {
    ...base,
    status: "available",
    priority: readinessWarnings > 0 ? "attention" : "normal",
    metrics: [
      metric("Accounts not ready", accountsNotReady, accountsNotReady === 0 ? "No pending items" : null, accountsNotReady > 0 ? "attention" : "good"),
      metric("Readiness warnings", readinessWarnings, readinessWarnings === 0 ? "No pending items" : null, readinessWarnings > 0 ? "attention" : "good"),
    ],
  };
}

function metricValue(cards: OperatorQueueCard[], cardId: OperatorQueueCard["id"], label: string): number | null {
  return cards.find((card) => card.id === cardId)?.metrics.find((item) => item.label === label)?.value ?? null;
}

function addNullable(values: Array<number | null>): number | null {
  let sawValue = false;
  let total = 0;
  for (const value of values) {
    if (typeof value !== "number") continue;
    sawValue = true;
    total += value;
  }
  return sawValue ? total : null;
}

function buildHeadlines(cards: OperatorQueueCard[]): OperatorHeadline[] {
  const overdue = addNullable([
    metricValue(cards, "retained-cadence", "Overdue"),
    metricValue(cards, "outcome-verification", "Overdue"),
  ]);
  const blocked = addNullable([
    metricValue(cards, "delivery-queue", "Failed"),
    metricValue(cards, "outcome-verification", "Critical"),
  ]);
  const safeToApprove = metricValue(cards, "delivery-queue", "Safe to approve");
  const escalationRisk = addNullable([
    metricValue(cards, "retained-cadence", "Overdue"),
    metricValue(cards, "suppression-ledger", "High-risk"),
    metricValue(cards, "outcome-verification", "Critical"),
  ]);

  return [
    { label: "Overdue", value: overdue, detail: "Cadence and verification queues", tone: overdue && overdue > 0 ? "risk" : "good" },
    { label: "Blocked", value: blocked, detail: "Failed delivery or critical review", tone: blocked && blocked > 0 ? "risk" : "good" },
    { label: "Safe to approve", value: safeToApprove, detail: "Client-safe delivery items", tone: safeToApprove && safeToApprove > 0 ? "attention" : "good" },
    { label: "Escalation risk", value: escalationRisk, detail: "Overdue, critical, or high-risk suppression", tone: escalationRisk && escalationRisk > 0 ? "risk" : "good" },
  ];
}

export async function buildOperatorCommandCentreSummary(
  loaders: OperatorCommandCentreLoaders = {},
): Promise<OperatorCommandCentreSummary> {
  const resolved = {
    loadCadenceQueue: loaders.loadCadenceQueue ?? defaultLoadCadenceQueue,
    loadDeliveries: loaders.loadDeliveries ?? defaultLoadDeliveries,
    loadSuppressions: loaders.loadSuppressions ?? defaultLoadSuppressions,
    loadOutcomePosture: loaders.loadOutcomePosture ?? defaultLoadOutcomePosture,
  };
  const now = new Date();

  const cards = await Promise.all([
    buildOversightReviewCard(resolved),
    buildRetainedCadenceCard(resolved, now),
    buildDeliveryQueueCard(resolved),
    buildSuppressionLedgerCard(resolved),
    buildOutcomeVerificationCard(resolved),
    buildRetainerReadinessCard(resolved),
  ]);

  return {
    generatedAt: now.toISOString(),
    headlines: buildHeadlines(cards),
    cards,
  };
}
