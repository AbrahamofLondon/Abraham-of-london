// app/api/instruments/[slug]/artifact/route.ts
//
// Serve or register an artifact for a Decision Instrument run.
//
// AUTHORITY RULES:
//   1. Artifact access requires a runId — slug-only access is BLOCKED.
//   2. The run record must exist and belong to the requesting user (userId or userEmail).
//   3. artifactState must be READY before artifact URL is served.
//   4. POST: Admin-only — registers an artifact URL + hash for a completed run.
//   5. GET:  User-facing — returns artifact metadata if ownership verified.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma.server";
import { recordArtifact, beginArtifactGeneration } from "@/lib/decision-instruments/instrument-run-authority";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";

// ─── GET — serve artifact metadata by runId + owner ──────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const { slug: instrumentSlug } = params;
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? url.searchParams.get("userEmail");
  const userId = url.searchParams.get("userId");

  // ── Slug-only access is blocked ──────────────────────────────────────────
  if (!runId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Artifact access requires a runId. Slug-only artifact access is not permitted.",
        code: "RUN_ID_REQUIRED",
      },
      { status: 403 },
    );
  }

  if (!session?.user?.email && !userEmail && !userId) {
    return NextResponse.json(
      { ok: false, error: "Authentication required", code: "AUTHENTICATION_REQUIRED" },
      { status: 401 },
    );
  }

  // ── Require user identity ─────────────────────────────────────────────────
  if (!userEmail && !userId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Artifact access requires user identity (userId or userEmail).",
        code: "IDENTITY_REQUIRED",
      },
      { status: 403 },
    );
  }

  // ── Load and verify run ownership ────────────────────────────────────────
  const run = await prisma.decisionInstrumentRun.findUnique({
    where: { id: runId },
    select: {
      id: true,
      instrumentSlug: true,
      userId: true,
      userEmail: true,
      status: true,
      artifactState: true,
      artifactUrl: true,
      artifactHash: true,
      completedAt: true,
    },
  });

  if (!run) {
    return NextResponse.json(
      { ok: false, error: `Run ${runId} not found`, code: "RUN_NOT_FOUND" },
      { status: 404 },
    );
  }

  // ── Verify the run belongs to the requester ───────────────────────────────
  const ownerMatch =
    (userId && run.userId === userId) ||
    (userEmail && run.userEmail === userEmail);

  if (!ownerMatch) {
    return NextResponse.json(
      { ok: false, error: "Access denied — this run does not belong to the requesting user.", code: "OWNERSHIP_DENIED" },
      { status: 403 },
    );
  }

  // ── Verify the instrument matches ─────────────────────────────────────────
  if (run.instrumentSlug !== instrumentSlug) {
    return NextResponse.json(
      { ok: false, error: "Run instrument slug does not match route slug.", code: "SLUG_MISMATCH" },
      { status: 400 },
    );
  }

  // ── Check artifact state ──────────────────────────────────────────────────
  if (run.artifactState !== "READY") {
    return NextResponse.json(
      {
        ok: false,
        error: `Artifact is not ready. Current state: ${run.artifactState}`,
        artifactState: run.artifactState,
        code: "ARTIFACT_NOT_READY",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    runId,
    instrumentSlug,
    artifactUrl: run.artifactUrl,
    artifactHash: run.artifactHash,
    completedAt: run.completedAt?.toISOString(),
  });
}

// ─── POST — admin: register artifact for completed run ────────────────────────

const registerSchema = z.object({
  runId: z.string().min(1),
  artifactUrl: z.string().url(),
  artifactHash: z.string().regex(/^[0-9a-f]{64}$/, "artifactHash must be a 64-char hex SHA-256"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const { runId, artifactUrl, artifactHash } = parsed.data;

  // Verify run exists and is completed
  const run = await prisma.decisionInstrumentRun.findUnique({
    where: { id: runId },
    select: { id: true, status: true, instrumentSlug: true, artifactState: true },
  });

  if (!run) {
    return NextResponse.json({ ok: false, error: `Run ${runId} not found` }, { status: 404 });
  }

  if (run.status !== "COMPLETED") {
    return NextResponse.json(
      {
        ok: false,
        error: `Cannot register artifact for run in status "${run.status}". Run must be COMPLETED.`,
        code: "RUN_NOT_COMPLETED",
      },
      { status: 422 },
    );
  }

  if (run.instrumentSlug !== params.slug) {
    return NextResponse.json(
      { ok: false, error: "Run slug does not match route slug.", code: "SLUG_MISMATCH" },
      { status: 400 },
    );
  }

  // Transition to GENERATING then READY
  await beginArtifactGeneration(runId);
  await recordArtifact(runId, { artifactUrl, artifactHash });

  return NextResponse.json({
    ok: true,
    runId,
    artifactUrl,
    artifactHash,
    artifactState: "READY",
  });
}
