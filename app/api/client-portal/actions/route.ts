// app/api/client-portal/actions/route.ts
// Client-facing: manage decision action items.
//
// GET  ?token=<raw>              → list all actions for the client
// POST ?token=<raw>  body: {...} → create a new action item
// PATCH ?token=<raw> body: { id, ...updates } → update an existing action item

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ClientPortalTokenService } from "@/lib/client-portal/client-portal-token";
import { ClientActionLog } from "@/lib/client-portal/client-action-log";
import { checkBoardroomRateLimit, extractIp } from "@/lib/boardroom/boardroom-server-rate-limit";
import { z } from "zod";

const DENIED = NextResponse.json(
  { ok: false, error: "Access link invalid or expired." },
  { status: 403 },
);

async function resolveClientEmail(rawToken: string | null): Promise<string | null> {
  if (!rawToken) return null;
  const validation = await ClientPortalTokenService.validateSession(rawToken);
  return validation.valid ? validation.session.clientEmail : null;
}

const createActionSchema = z.object({
  findingTitle: z.string().min(1).max(500),
  recommendedAction: z.string().min(1).max(1000),
  dossierId: z.string().optional(),
  findingRef: z.string().optional(),
  owner: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
});

const updateActionSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "ACTIONED", "DEFERRED", "WONT_ACT"]).optional(),
  owner: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  outcomeNote: z.string().optional(),
  followUpDate: z.string().datetime().nullable().optional(),
  actionedAt: z.string().datetime().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const ip = extractIp(request);
  const rl = checkBoardroomRateLimit(ip);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token");
  const clientEmail = await resolveClientEmail(rawToken);
  if (!clientEmail) return DENIED;

  const actions = await ClientActionLog.forClient(clientEmail);
  const summary = await ClientActionLog.summary(clientEmail);
  return NextResponse.json({ ok: true, actions, summary });
}

export async function POST(request: NextRequest) {
  const ip = extractIp(request);
  const rl = checkBoardroomRateLimit(ip);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token");
  const clientEmail = await resolveClientEmail(rawToken);
  if (!clientEmail) return DENIED;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = createActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 },
      );
    }

    const action = await ClientActionLog.create({
      clientEmail,
      findingTitle: parsed.data.findingTitle,
      recommendedAction: parsed.data.recommendedAction,
      dossierId: parsed.data.dossierId ?? null,
      findingRef: parsed.data.findingRef ?? null,
      owner: parsed.data.owner ?? null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      severity: parsed.data.severity ?? "MEDIUM",
    });

    return NextResponse.json({ ok: true, action }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to create action" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const ip = extractIp(request);
  const rl = checkBoardroomRateLimit(ip);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token");
  const clientEmail = await resolveClientEmail(rawToken);
  if (!clientEmail) return DENIED;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = updateActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 },
      );
    }

    const { id, ...updates } = parsed.data;

    const action = await ClientActionLog.update(id, clientEmail, {
      status: updates.status,
      owner: updates.owner,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : updates.dueDate === null ? null : undefined,
      outcomeNote: updates.outcomeNote,
      followUpDate: updates.followUpDate ? new Date(updates.followUpDate) : updates.followUpDate === null ? null : undefined,
      actionedAt: updates.actionedAt ? new Date(updates.actionedAt) : updates.actionedAt === null ? null : undefined,
    });

    return NextResponse.json({ ok: true, action });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to update action" },
      { status: 500 },
    );
  }
}
