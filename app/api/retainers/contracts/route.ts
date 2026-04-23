import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import {
  createRetainerContract,
  normalizeRetainerTier,
  type RetainerStatus,
} from "@/lib/retainers/retainer-service";

const VALID_STATUSES = new Set<RetainerStatus>(["ACTIVE", "PAUSED", "TERMINATED"]);

export async function GET(req: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const organisationId = searchParams.get("organisationId");
  const status = searchParams.get("status");

  const contracts = await prisma.retainerContract.findMany({
    where: {
      ...(organisationId ? { organisationId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      organisation: { select: { id: true, name: true, slug: true } },
      _count: { select: { retainedDecisions: true } },
    },
  });

  return NextResponse.json({ ok: true, contracts });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const organisationId = typeof body?.organisationId === "string" ? body.organisationId.trim() : "";
    const tier = typeof body?.tier === "string" ? normalizeRetainerTier(body.tier) : null;
    const status = typeof body?.status === "string" && VALID_STATUSES.has(body.status)
      ? body.status as RetainerStatus
      : "ACTIVE";

    if (!organisationId || !tier) {
      return NextResponse.json({ ok: false, error: "organisationId and tier are required" }, { status: 400 });
    }

    const contract = await createRetainerContract({
      organisationId,
      tier,
      status,
      startDate: body?.startDate ? new Date(String(body.startDate)) : undefined,
      endDate: body?.endDate ? new Date(String(body.endDate)) : null,
      stripeSubscriptionId: typeof body?.stripeSubscriptionId === "string" ? body.stripeSubscriptionId.trim() : null,
      actorId: auth.userId,
    });

    return NextResponse.json({ ok: true, contract });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create retainer contract" },
      { status: 400 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const status = typeof body?.status === "string" && VALID_STATUSES.has(body.status)
      ? body.status as RetainerStatus
      : null;

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "id and valid status are required" }, { status: 400 });
    }

    const contract = await prisma.retainerContract.update({
      where: { id },
      data: { status },
    });

    const { recordAuditEvent } = await import("@/lib/enterprise-foundation/authority-foundation");
    await recordAuditEvent({
      actorType: "ADMIN",
      actorId: auth.userId,
      objectType: "CONTRACT",
      objectId: id,
      actionType: status === "TERMINATED" ? "TERMINATED" : "UPDATED",
      summary: `Retainer contract state changed to ${status}.`,
      metadata: { status },
    }).catch(() => null);

    return NextResponse.json({ ok: true, contract });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update retainer contract" },
      { status: 400 },
    );
  }
}
