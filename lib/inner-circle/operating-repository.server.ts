import crypto from "crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_READING_PATH,
  founderUnderPressureWorksheet,
  productRoute,
  scoreRiseDecay,
  type AccessState,
  type PressureSignalResult,
  type RiseDecayAnswers,
  type RiseDecayScoreResult,
} from "@/lib/inner-circle/operating-layer";
import { isSubscriptionEnforced } from "@/lib/inner-circle/feature-flags";

type Db = PrismaClient;

export type InnerCircleProfileState = {
  userId: string;
  email: string | null;
  name: string | null;
  accessState: AccessState;
  membershipTier: "free" | "digital" | "operator" | "private_council";
  activePath: string;
  latestResult: {
    id: string;
    toolSlug: string;
    score: number;
    riskLevel: string;
    recommendedNextAction: string;
    createdAt: string;
  } | null;
  activeQualification: {
    status: string;
    recommendedProduct: string;
    reason: string;
  } | null;
  worksheet: Array<{
    id: string;
    task: string;
    response: string | null;
    deadline: string | null;
    status: string;
    note: string | null;
    nextReviewDate: string | null;
  }>;
};

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function asJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

async function hasPaidInnerCircleAccess(db: Db, userId: string): Promise<boolean> {
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "Entitlement"
    WHERE "userId" = ${userId}
      AND "status" = 'ACTIVE'
      AND (
        ("type" = 'TIER' AND "key" IN ('inner_circle', 'inner-circle', 'digital', 'operator', 'private_council'))
        OR ("type" = 'PRODUCT' AND "key" IN ('inner-circle-digital', 'operator-circle', 'private-council'))
      )
    LIMIT 1
  `;

  return rows.length > 0;
}

export async function ensureOperatingProfile(input: {
  userId: string;
  email?: string | null;
  name?: string | null;
  db?: Db;
}): Promise<InnerCircleProfileState> {
  const db = input.db ?? prisma;
  const paid = await hasPaidInnerCircleAccess(db, input.userId).catch(() => false);
  const membershipTier = paid ? "digital" : "free";

  await db.$executeRaw`
    INSERT INTO inner_circle_profiles (
      id, user_id, email, name, access_state, membership_tier, active_path, created_at, updated_at
    )
    VALUES (
      ${id("icp")},
      ${input.userId},
      ${input.email ?? null},
      ${input.name ?? null},
      'Reader',
      ${membershipTier},
      ${ACTIVE_READING_PATH},
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      email = COALESCE(EXCLUDED.email, inner_circle_profiles.email),
      name = COALESCE(EXCLUDED.name, inner_circle_profiles.name),
      membership_tier = EXCLUDED.membership_tier,
      updated_at = NOW()
  `;

  await db.$executeRaw`
    INSERT INTO inner_circle_tool_access (
      id, user_id, tool_slug, access_status, access_reason, created_at, updated_at
    )
    VALUES (
      ${id("icta")},
      ${input.userId},
      'rise-decay-scorecard',
      'granted',
      'Free registered users may complete the first diagnostic.',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, tool_slug)
    DO UPDATE SET updated_at = NOW()
  `;

  await db.$executeRaw`
    INSERT INTO inner_circle_reading_path_progress (
      id, user_id, path_slug, status, current_step, created_at, updated_at
    )
    VALUES (
      ${id("icpp")},
      ${input.userId},
      ${ACTIVE_READING_PATH},
      'active',
      0,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, path_slug)
    DO UPDATE SET updated_at = NOW()
  `;

  for (const [index, task] of founderUnderPressureWorksheet.entries()) {
    await db.$executeRaw`
      INSERT INTO inner_circle_worksheet_actions (
        id, user_id, path_slug, task_key, task, status, sort_order, created_at, updated_at
      )
      VALUES (
        ${id("icwa")},
        ${input.userId},
        ${ACTIVE_READING_PATH},
        ${task.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")},
        ${task},
        'not_started',
        ${index},
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, path_slug, task_key)
      DO UPDATE SET task = EXCLUDED.task, sort_order = EXCLUDED.sort_order, updated_at = NOW()
    `;
  }

  return getOperatingProfile(input.userId, db);
}

export async function getOperatingProfile(userId: string, db: Db = prisma): Promise<InnerCircleProfileState> {
  const profileRows = await db.$queryRaw<Array<{
    user_id: string;
    email: string | null;
    name: string | null;
    access_state: AccessState;
    membership_tier: "free" | "digital" | "operator" | "private_council";
    active_path: string;
  }>>`
    SELECT user_id, email, name, access_state, membership_tier, active_path
    FROM inner_circle_profiles
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  const profile = profileRows[0];
  if (!profile) {
    throw new Error("INNER_CIRCLE_PROFILE_NOT_FOUND");
  }

  const latestRows = await db.$queryRaw<Array<{
    id: string;
    tool_slug: string;
    score: number;
    risk_level: string;
    recommended_next_action: string;
    created_at: Date;
  }>>`
    SELECT id, tool_slug, score, risk_level, recommended_next_action, created_at
    FROM inner_circle_diagnostic_results
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const qualificationRows = await db.$queryRaw<Array<{
    status: string;
    recommended_product: string;
    reason: string;
  }>>`
    SELECT status, recommended_product, reason
    FROM inner_circle_advisory_qualifications
    WHERE user_id = ${userId}
      AND status IN ('OPEN', 'COUNCIL_CANDIDATE')
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const worksheetRows = await db.$queryRaw<Array<{
    id: string;
    task: string;
    response: string | null;
    deadline: Date | null;
    status: string;
    note: string | null;
    next_review_date: Date | null;
  }>>`
    SELECT id, task, response, deadline, status, note, next_review_date
    FROM inner_circle_worksheet_actions
    WHERE user_id = ${userId}
      AND path_slug = ${ACTIVE_READING_PATH}
    ORDER BY sort_order ASC
  `;

  const latest = latestRows[0] ?? null;
  const qualification = qualificationRows[0] ?? null;

  return {
    userId: profile.user_id,
    email: profile.email,
    name: profile.name,
    accessState: profile.access_state,
    membershipTier: profile.membership_tier,
    activePath: profile.active_path,
    latestResult: latest
      ? {
          id: latest.id,
          toolSlug: latest.tool_slug,
          score: Number(latest.score),
          riskLevel: latest.risk_level,
          recommendedNextAction: latest.recommended_next_action,
          createdAt: latest.created_at.toISOString(),
        }
      : null,
    activeQualification: qualification
      ? {
          status: qualification.status,
          recommendedProduct: qualification.recommended_product,
          reason: qualification.reason,
        }
      : null,
    worksheet: worksheetRows.map((row) => ({
      id: row.id,
      task: row.task,
      response: row.response,
      deadline: row.deadline?.toISOString() ?? null,
      status: row.status,
      note: row.note,
      nextReviewDate: row.next_review_date?.toISOString() ?? null,
    })),
  };
}

export async function getCompletedDiagnosticCount(userId: string, db: Db = prisma): Promise<number> {
  const rows = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM inner_circle_diagnostic_results
    WHERE user_id = ${userId}
      AND lifecycle_status = 'completed'
  `;

  return Number(rows[0]?.count ?? 0);
}

export async function getHighCriticalCount(userId: string, db: Db = prisma): Promise<number> {
  const rows = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM inner_circle_diagnostic_results
    WHERE user_id = ${userId}
      AND risk_level IN ('High', 'Critical')
  `;

  return Number(rows[0]?.count ?? 0);
}

export async function saveRiseDecayResult(input: {
  userId: string;
  answers: Partial<RiseDecayAnswers>;
  db?: Db;
}): Promise<RiseDecayScoreResult & { resultId: string }> {
  const db = input.db ?? prisma;
  const profile = await ensureOperatingProfile({ userId: input.userId, db });
  const completedCount = await getCompletedDiagnosticCount(input.userId, db);

  // Production safety: subscription restriction is not enforced unless explicitly enabled
  if (isSubscriptionEnforced() && profile.membershipTier === "free" && completedCount > 0) {
    const latest = await getOperatingProfile(input.userId, db);
    throw Object.assign(new Error("FREE_DIAGNOSTIC_LIMIT_REACHED"), {
      latestResult: latest.latestResult,
    });
  }

  const previousHighCritical = await getHighCriticalCount(input.userId, db);
  const result = scoreRiseDecay(input.answers, previousHighCritical);
  const resultId = id("icdr");

  await db.$executeRaw`
    INSERT INTO inner_circle_diagnostic_results (
      id,
      user_id,
      tool_slug,
      path_slug,
      answers_json,
      score,
      risk_level,
      weakest_domains_json,
      recommended_next_action,
      recommended_product,
      lifecycle_status,
      created_at,
      updated_at
    )
    VALUES (
      ${resultId},
      ${input.userId},
      'rise-decay-scorecard',
      ${ACTIVE_READING_PATH},
      ${asJson(input.answers)}::jsonb,
      ${result.score},
      ${result.riskLevel},
      ${asJson(result.weakestDomains)}::jsonb,
      ${result.recommendedNextAction},
      ${result.route.productKey},
      'completed',
      NOW(),
      NOW()
    )
  `;

  const newAccessState: AccessState = result.councilCandidate ? "Council Candidate" : "Instrument User";
  await db.$executeRaw`
    UPDATE inner_circle_profiles
    SET access_state = ${newAccessState}, updated_at = NOW()
    WHERE user_id = ${input.userId}
  `;

  if (result.riskLevel === "High" || result.riskLevel === "Critical" || result.enterpriseIndicator || result.governanceRecurrence) {
    const recommendedProduct = result.enterpriseIndicator
      ? productRoute("enterprise-scan").productKey
      : result.governanceRecurrence
        ? productRoute("retainer-oversight").productKey
        : result.route.productKey;

    await db.$executeRaw`
      INSERT INTO inner_circle_advisory_qualifications (
        id,
        user_id,
        trigger_result_id,
        status,
        risk_level,
        recommended_product,
        reason,
        metadata_json,
        created_at,
        updated_at
      )
      VALUES (
        ${id("icaq")},
        ${input.userId},
        ${resultId},
        ${result.councilCandidate ? "COUNCIL_CANDIDATE" : "OPEN"},
        ${result.riskLevel},
        ${recommendedProduct},
        ${result.recommendedNextAction},
        ${asJson({
          weakestDomains: result.weakestDomains,
          enterpriseIndicator: result.enterpriseIndicator,
          governanceRecurrence: result.governanceRecurrence,
        })}::jsonb,
        NOW(),
        NOW()
      )
    `;
  }

  // Phase 4: Create 3 worksheet actions with due dates after scorecard completion
  const actionTasks = [
    { task: "Identify current decision bottleneck", daysOffset: 7 },
    { task: "Identify one unowned decision", daysOffset: 14 },
    { task: "Choose one governance repair action", daysOffset: 21 },
  ];

  for (const [index, action] of actionTasks.entries()) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + action.daysOffset);

    await db.$executeRaw`
      INSERT INTO inner_circle_worksheet_actions (
        id, user_id, path_slug, task_key, task, status, deadline, sort_order, created_at, updated_at
      )
      VALUES (
        ${id("icwa")},
        ${input.userId},
        ${ACTIVE_READING_PATH},
        ${action.task.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")},
        ${action.task},
        'not_started',
        ${dueDate},
        ${index},
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, path_slug, task_key)
      DO UPDATE SET deadline = EXCLUDED.deadline, sort_order = EXCLUDED.sort_order, updated_at = NOW()
    `;
  }

  return { ...result, resultId };
}

export async function recordPressureSignalEvent(input: {
  inputHash: string;
  result: PressureSignalResult;
  userId?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  db?: Db;
}): Promise<void> {
  const db = input.db ?? prisma;

  await db.$executeRaw`
    INSERT INTO pressure_signal_events (
      id,
      user_id,
      input_hash,
      pressure_level,
      recommended_product,
      safe_metrics_json,
      result_json,
      ip_hash,
      user_agent,
      created_at
    )
    VALUES (
      ${id("pse")},
      ${input.userId ?? null},
      ${input.inputHash},
      ${input.result.pressureLevel},
      ${input.result.route.productKey},
      ${asJson(input.result.safeMetrics)}::jsonb,
      ${asJson({
        pressureLevel: input.result.pressureLevel,
        consequenceWarning: input.result.consequenceWarning,
        firstWeaknessLikelyToBreak: input.result.firstWeaknessLikelyToBreak,
        recommendedNextStep: input.result.recommendedNextStep,
        route: input.result.route.productKey,
      })}::jsonb,
      ${input.ipHash ?? null},
      ${input.userAgent ? input.userAgent.slice(0, 180) : null},
      NOW()
    )
  `;
}
