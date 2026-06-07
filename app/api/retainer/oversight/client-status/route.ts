// app/api/retainer/oversight/client-status/route.ts
//
// Client-facing: returns the current client health status for a retainer contract.
// Does NOT expose raw drift scores, internal notes, or full intervention log.
// Returns safe summary only — gated on auth and contract ownership.
//
// AUTHORITY RULES:
//   - Not self-serve — requires authenticated session.
//   - Retainer Oversight is NEVER activated from this endpoint alone.
//   - Returns safe client-facing fields only: health, next review date, open interventions count.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getClientHealthStatus,
  getLatestCompletedCycle,
  getCyclesForContract,
} from "@/lib/retainer/oversight-cycle-service";
import { prisma } from "@/lib/prisma.server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(request.url);
  const contractId = url.searchParams.get("contractId");

  if (!contractId) {
    return NextResponse.json({ ok: false, error: "contractId is required" }, { status: 400 });
  }

  // Verify contract ownership — client may only query their own contract.
  // RetainerContract is owned by an Organisation; membership is via OrganisationMembership.email.
  const contract = await prisma.retainerContract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      status: true,
      organisationId: true,
      organisation: {
        select: {
          memberships: {
            where: { email: session.user.email, status: "active" },
            select: { id: true },
          },
        },
      },
    },
  }).catch(() => null);

  if (!contract) {
    return NextResponse.json({ ok: false, error: "Contract not found" }, { status: 404 });
  }

  // clientEmail check: user must be an active member of the contract's organisation
  const isMember = (contract.organisation?.memberships?.length ?? 0) > 0;
  if (!isMember) {
    return NextResponse.json(
      { ok: false, error: "Access denied — contract does not belong to this account" },
      { status: 403 },
    );
  }
  // clientEmail is the verified identity for this request
  const clientEmail = session.user.email;
  void clientEmail; // used for ownership verification above; retained for audit context

  const [clientHealth, latestCycle, allCycles] = await Promise.all([
    getClientHealthStatus(contractId),
    getLatestCompletedCycle(contractId),
    getCyclesForContract(contractId),
  ]);

  const openInterventions = allCycles
    .filter((c) => c.status === "OPEN" || c.status === "UNDER_REVIEW")
    .reduce((sum, c) => sum + c.interventionCount, 0);

  return NextResponse.json({
    ok: true,
    contractId,
    clientHealth,
    lastReviewDate: latestCycle?.reviewedAt?.toISOString() ?? null,
    lastOutcomeSummary: latestCycle?.outcomeSummary ?? null,
    nextReviewDate: latestCycle?.nextCycleDate?.toISOString() ?? null,
    openInterventions,
    totalCycles: allCycles.length,
    completedCycles: allCycles.filter((c) => c.status === "COMPLETED").length,
  });
}
