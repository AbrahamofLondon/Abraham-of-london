import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { getUserAccess } from "@/lib/access/get-user-access";
import { getRetainerDecisionSurface, verifyRetainerAccess } from "@/lib/retainers/retainer-service";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string | null } | undefined)?.id ?? null;
  const email = session?.user?.email?.toLowerCase() ?? null;
  const access = await getUserAccess(prisma, userId);

  if (!access.permissions.isAuthenticated || !email) {
    return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const organisationId = searchParams.get("organisationId");
  const contractId = searchParams.get("contractId");

  if (!organisationId && !contractId) {
    return NextResponse.json({ ok: false, error: "organisationId or contractId is required" }, { status: 400 });
  }

  if (organisationId && !access.permissions.isAdmin) {
    const membership = await prisma.organisationMembership.findFirst({
      where: {
        organisationId,
        email,
        status: "active",
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json({ ok: false, error: "Organisation access required" }, { status: 403 });
    }
  }

  const retainerAccess = await verifyRetainerAccess({ organisationId, contractId, email });
  if (!retainerAccess.ok) {
    return NextResponse.json({ ok: false, error: retainerAccess.reason }, { status: 403 });
  }

  const contracts = await getRetainerDecisionSurface({ organisationId, contractId });
  return NextResponse.json({ ok: true, contracts });
}
