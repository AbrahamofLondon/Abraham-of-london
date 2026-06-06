import crypto from "node:crypto";

import { Prisma } from "@prisma/client";

import {
  validateGmiRedTeamChallenge,
  type GmiRedTeamChallengeInput,
} from "./gmi-instrument";

type SqlClient = {
  $executeRaw: (query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => Promise<number>;
  $queryRaw: <T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => Promise<T>;
};

type RedTeamRow = {
  id: string;
  editionId: string | null;
  callId: string | null;
  submitterName: string;
  submitterEmail: string;
  organisation: string | null;
  counterArgument: string;
  evidence: string;
  sourceLinks: unknown;
  status: string;
  adminNotes: string | null;
  publicResponse: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
};

export type GmiRedTeamSubmissionView = {
  id: string;
  editionId: string | null;
  callId: string | null;
  submitterName: string;
  submitterEmail?: string;
  organisation: string | null;
  counterArgument: string;
  evidence: string;
  sourceLinks: string[];
  status: string;
  adminNotes?: string | null;
  publicResponse: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

export type RedTeamReviewStatus =
  | "pending"
  | "acknowledged"
  | "rejected"
  | "incorporated"
  | "disconfirmed_call"
  | "closed";

function getPrisma(): SqlClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/lib/prisma.server").prisma as SqlClient;
}

function id(): string {
  return crypto.randomUUID();
}

function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function parseLinks(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function rowToView(row: RedTeamRow, includeEmail: boolean): GmiRedTeamSubmissionView {
  return {
    id: row.id,
    editionId: row.editionId,
    callId: row.callId,
    submitterName: row.submitterName,
    ...(includeEmail ? { submitterEmail: row.submitterEmail } : {}),
    organisation: row.organisation,
    counterArgument: row.counterArgument,
    evidence: row.evidence,
    sourceLinks: parseLinks(row.sourceLinks),
    status: row.status,
    ...(includeEmail ? { adminNotes: row.adminNotes } : {}),
    publicResponse: row.publicResponse,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewedBy: row.reviewedBy,
  };
}

export function redactGmiRedTeamSubmissionForPublic(
  submission: GmiRedTeamSubmissionView,
): GmiRedTeamSubmissionView {
  const { submitterEmail: _submitterEmail, adminNotes: _adminNotes, ...publicSubmission } = submission;
  return publicSubmission;
}

async function selectRows(db: SqlClient, whereSql: Prisma.Sql): Promise<RedTeamRow[]> {
  return db.$queryRaw<RedTeamRow[]>`
    SELECT
      "id",
      "edition_id" AS "editionId",
      "call_id" AS "callId",
      "submitter_name" AS "submitterName",
      "submitter_email" AS "submitterEmail",
      "organisation",
      "counter_argument" AS "counterArgument",
      "evidence",
      "source_links_json" AS "sourceLinks",
      "status",
      "admin_notes" AS "adminNotes",
      "public_response" AS "publicResponse",
      "created_at" AS "createdAt",
      "reviewed_at" AS "reviewedAt",
      "reviewed_by" AS "reviewedBy"
    FROM "gmi_red_team_submissions"
    ${whereSql}
    ORDER BY "created_at" DESC
    LIMIT 100
  `;
}

export async function createGmiRedTeamSubmission(
  input: GmiRedTeamChallengeInput & { editionId?: string | null; organisation?: string | null },
): Promise<{ ok: true; id: string } | { ok: false; issues: string[] }> {
  const validation = validateGmiRedTeamChallenge(input);
  if (!validation.accepted) return { ok: false, issues: validation.issues };

  const submissionId = id();
  const db = getPrisma();
  await db.$executeRaw`
    INSERT INTO "gmi_red_team_submissions" (
      "id",
      "edition_id",
      "call_id",
      "submitter_name",
      "submitter_email",
      "organisation",
      "counter_argument",
      "evidence",
      "source_links_json",
      "status"
    )
    VALUES (
      ${submissionId},
      ${input.editionId ?? null},
      ${input.callId},
      ${input.submitterName},
      ${input.submitterEmail},
      ${input.organisation ?? null},
      ${input.counterThesis},
      ${input.evidence},
      CAST(${toJson(input.sourceLinks)} AS jsonb),
      ${"pending"}
    )
  `;

  return { ok: true, id: submissionId };
}

export async function listGmiRedTeamSubmissions(
  status?: string,
): Promise<GmiRedTeamSubmissionView[]> {
  try {
    const db = getPrisma();
    const rows = status
      ? await selectRows(db, Prisma.sql`WHERE "status" = ${status}`)
      : await selectRows(db, Prisma.empty);
    return rows.map((row) => rowToView(row, true));
  } catch {
    return [];
  }
}

export async function listPublicAcknowledgedGmiRedTeamSubmissions(): Promise<GmiRedTeamSubmissionView[]> {
  try {
    const db = getPrisma();
    const rows = await selectRows(
      db,
      Prisma.sql`WHERE "status" IN ('acknowledged', 'incorporated', 'disconfirmed_call') AND "public_response" IS NOT NULL`,
    );
    return rows.map((row) => redactGmiRedTeamSubmissionForPublic(rowToView(row, true)));
  } catch {
    return [];
  }
}

export async function updateGmiRedTeamSubmissionReview(input: {
  id: string;
  status: RedTeamReviewStatus;
  adminNotes?: string | null;
  publicResponse?: string | null;
  reviewedBy?: string | null;
}): Promise<{ ok: true } | { ok: false; warning: string }> {
  try {
    const db = getPrisma();
    await db.$executeRaw`
      UPDATE "gmi_red_team_submissions"
      SET
        "status" = ${input.status},
        "admin_notes" = ${input.adminNotes ?? null},
        "public_response" = ${input.publicResponse ?? null},
        "reviewed_by" = ${input.reviewedBy ?? "ADMIN"},
        "reviewed_at" = ${new Date()}
      WHERE "id" = ${input.id}
    `;
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      warning: error instanceof Error ? error.message : "Red Team review update failed.",
    };
  }
}
