import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { applyEnforcementPlaybook, createEnforcementPlaybook } from "@/lib/enterprise-foundation/authority-foundation";

export async function GET() {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  const playbooks = await prisma.enforcementPlaybook.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  return NextResponse.json({ ok: true, playbooks });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    if (body?.action === "apply") {
      const application = await applyEnforcementPlaybook({
        playbookId: String(body?.playbookId || "").trim(),
        retainedDecisionId: String(body?.retainedDecisionId || "").trim(),
        actorId: auth.userId,
      });
      return NextResponse.json({ ok: true, application });
    }

    const playbook = await createEnforcementPlaybook({
      name: String(body?.name || "").trim(),
      triggerPattern: String(body?.triggerPattern || "").trim(),
      actionSequence: body?.actionSequence ?? [],
      expectedOutcome: typeof body?.expectedOutcome === "string" ? body.expectedOutcome : null,
      actorId: auth.userId,
    });
    return NextResponse.json({ ok: true, playbook });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to process playbook request" }, { status: 400 });
  }
}
