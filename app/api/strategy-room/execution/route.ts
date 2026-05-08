import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma.server";
import { randomUUID } from "crypto";
import { getDiagnosticJourney } from "@/lib/diagnostics/journey-store";
import {
  buildDecisionSurfacePayload,
  insufficientEvidenceContradiction,
} from "@/lib/contracts/decision-surface";
import {
  enforceAppRouteRateLimit,
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
} from "@/lib/server/security/app-route-guards";
import { assertStrategyRoomAccess, authorizeStrategyRoomEntry } from "@/lib/server/strategy-room/access.server";
import { findLatestStrategyExecutionRecord } from "@/lib/strategy-room/execution-record";
import { evaluateStrategyRoomAdmission } from "@/lib/strategy-room/admission";

const postSchema = z.object({
  strategyRoomSessionId: z.string().trim().max(128).optional().nullable(),
  email: z.string().trim().email().max(320).optional().nullable(),
  directive: z.string().trim().max(80).optional().nullable(),
  escalationLevel: z.string().trim().max(80).optional().nullable(),
  conditionSummary: z.string().trim().max(1200).optional().nullable(),
  coreProblem: z.string().trim().max(1200).optional().nullable(),
  decisionQuestion: z.string().trim().max(1200).optional().nullable(),
  constraints: z.unknown().optional(),
  exposureLevel: z.string().trim().max(80).optional().nullable(),
  interventionStack: z.unknown().optional(),
  constraintMap: z.unknown().optional(),
  canonicalSnapshot: z.unknown().optional(),
}).strict();

/**
 * POST — Create a new Strategy Room execution session
 * GET  — List sessions (for admin / user lookup)
 */

export async function POST(req: NextRequest) {
  try {
    const methodCheck = requireMethod(req, ["POST"]);
    if (!methodCheck.ok) return methodCheck.response;

    const contentCheck = requireJsonContent(req);
    if (!contentCheck.ok) return contentCheck.response;

    const parsed = await parseJsonBody(req, postSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const entryAuth = await authorizeStrategyRoomEntry({
      request: req,
      intakeEmail: body.email ?? null,
    });
    if (!entryAuth.ok) {
      return noStoreJson({ error: entryAuth.error }, { status: entryAuth.status });
    }

    const rateLimit = await enforceAppRouteRateLimit({
      request: req,
      routeKey: "strategy-room-execution-create",
      limit: 10,
      windowMs: 15 * 60_000,
      email: entryAuth.identityEmail,
      failClosed: true,
    });
    if (!rateLimit.ok) return rateLimit.response;

    const {
      strategyRoomSessionId,
      email,
      directive,
      escalationLevel,
      conditionSummary,
      coreProblem,
      decisionQuestion,
      constraints,
      exposureLevel,
      interventionStack,
      constraintMap,
      canonicalSnapshot,
    } = body;

    // ── SERVER-SIDE ADMISSION ENFORCEMENT ──
    // Validates diagnostic evidence, decision specificity, authority, and readiness
    // before allowing execution session creation. Client-side state is not authoritative.
    const admission = await evaluateStrategyRoomAdmission({
      email: email ?? entryAuth.identityEmail ?? null,
      decisionStatement: decisionQuestion ?? coreProblem ?? null,
      preCommitment: true, // Reaching execution endpoint implies pre-commitment
    });

    if (admission.status === "RESTRICTED") {
      return noStoreJson(
        {
          error: "Strategy Room admission restricted.",
          admission: {
            status: admission.status,
            reasons: admission.reasons,
            missingEvidence: admission.missingEvidence,
            repairActions: admission.repairActions,
            returnPath: admission.returnPath,
          },
        },
        { status: 403 },
      );
    }

    if (strategyRoomSessionId) {
      const access = await assertStrategyRoomAccess({
        request: req,
        sessionRef: strategyRoomSessionId,
        purpose: "strategy_room_access",
        allowTokenPurposes: ["strategy_room_access", "return_brief"],
      });
      if (!access.ok) {
        return noStoreJson({ error: access.error }, { status: access.status });
      }
    }

    const evidenceJourney = email
      ? await getDiagnosticJourney({ email })
      : null;
    const latestDecisionObject = evidenceJourney
      ? [...evidenceJourney.decisionObjects].reverse()[0] ?? null
      : null;
    const latestContradictions = evidenceJourney
      ? evidenceJourney.evidenceNodes
          .filter((node) => node.kind === "contradiction")
          .slice(-3)
      : [];
    const latestActions = evidenceJourney
      ? evidenceJourney.evidenceNodes
          .filter((node) => node.kind === "action")
          .slice(-3)
          .map((node) => node.summary)
      : [];
    const latestExecutionRecord = await findLatestStrategyExecutionRecord({
      sessionId: strategyRoomSessionId ?? null,
      email: email ?? null,
    });

    if (!latestDecisionObject) {
      return NextResponse.json(
        { error: "Strategy Room requires a canonical decision object before execution can start" },
        { status: 409 },
      );
    }

    const session = await prisma.strategyRoomExecutionSession.create({
      data: {
        sessionKey: `exec_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
        strategyRoomSessionId: strategyRoomSessionId ?? null,
        email: email ?? null,
        directive: directive ?? null,
        escalationLevel: escalationLevel ?? null,
        conditionSummary:
          conditionSummary
          ?? latestExecutionRecord?.timeline
          ?? latestContradictions[0]?.summary
          ?? null,
        coreProblem:
          coreProblem
          ?? latestExecutionRecord?.conflictResolved
          ?? latestContradictions[0]?.label
          ?? null,
        decisionQuestion:
          decisionQuestion
          ?? latestExecutionRecord?.decision
          ?? latestDecisionObject?.decisionText
          ?? null,
        constraints: constraints
          ? JSON.stringify(constraints)
          : latestDecisionObject?.constraintText
            ? JSON.stringify([latestDecisionObject.constraintText])
            : null,
        exposureLevel: exposureLevel ?? null,
        interventionStack: interventionStack
          ? JSON.stringify(interventionStack)
          : latestActions.length
            ? JSON.stringify(latestActions.map((action, index) => ({
                id: `graph_action_${index + 1}`,
                intent: action,
                expectedEffect: "Reduce the highest-ranked unresolved contradiction.",
                riskIfIgnored: latestContradictions[0]?.summary ?? "The contradiction remains unmanaged.",
                urgency: index === 0 ? "HIGH" : "MEDIUM",
                dependency: index === 0 ? "Decision owner confirmed" : "Previous action completed",
                executionFriction: index === 0 ? "MEDIUM" : "LOW",
                failureSignal: "No owner, date, or observable movement is recorded.",
              })))
            : null,
        constraintMap: constraintMap ? JSON.stringify(constraintMap) : null,
        canonicalSnapshot: canonicalSnapshot
          ? JSON.stringify(canonicalSnapshot)
          : evidenceJourney
            ? JSON.stringify({
                executionRecord: latestExecutionRecord,
                evidenceGraph: {
                  decisionObjects: evidenceJourney.decisionObjects,
                  nodes: evidenceJourney.evidenceNodes,
                },
                admission: admission.status === "ADMITTED"
                  ? {
                      caseId: admission.caseId,
                      decisionId: admission.decisionId,
                      evidenceTier: admission.evidenceTier,
                      directive: admission.directive,
                      reasons: admission.reasons,
                    }
                  : null,
              })
            : null,
        status: "active",
      },
    });

    const decisionSurface = buildDecisionSurfacePayload({
      decisionId: latestDecisionObject.decisionKey,
      contradictions: latestContradictions.length
        ? latestContradictions.map((node) => ({
            label: node.label,
            summary: node.summary,
            severity: node.severity,
            confidence: node.confidence,
            sourceStage: node.sourceStage,
          }))
        : [insufficientEvidenceContradiction({
            id: `strategy-room:${session.id}:no-contradictions`,
            sourceStage: "strategy_room",
            summary: "Execution session has a decision object but no persisted contradiction node.",
          })],
      enforcementState: "ACTIVE",
      consequenceScore: 70,
    });

    return NextResponse.json({ ok: true, id: session.id, sessionKey: session.sessionKey, decisionSurface, decisionSurfacePayload: decisionSurface });
  } catch (err) {
    console.error("[execution-session-create]", err);
    return NextResponse.json(
      { error: "Failed to create execution session" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const methodCheck = requireMethod(req, ["GET"]);
    if (!methodCheck.ok) return methodCheck.response;

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const status = searchParams.get("status");

    const entryAuth = await authorizeStrategyRoomEntry({
      request: req,
      intakeEmail: email,
    });
    if (!entryAuth.ok) {
      return noStoreJson({ error: entryAuth.error }, { status: entryAuth.status });
    }

    const where: Record<string, unknown> = {};
    where.email = entryAuth.identityEmail;
    if (status) where.status = status;

    const sessions = await prisma.strategyRoomExecutionSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        decisions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return NextResponse.json({ ok: true, sessions });
  } catch (err) {
    console.error("[execution-session-list]", err);
    return NextResponse.json(
      { error: "Failed to list execution sessions" },
      { status: 500 },
    );
  }
}
