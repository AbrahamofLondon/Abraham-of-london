import { prisma } from "@/lib/prisma.server";
import {
  isSupportedDecisionProvenanceSubjectType,
  type SupportedDecisionProvenanceSubjectType,
} from "@/lib/admin/decision-provenance-record";
import { loadOversightCycleArchive } from "@/lib/product/oversight-cycle-archive";
import { listAllDeliveries } from "@/lib/product/oversight-delivery-service";
import { verifyRetainerAccess } from "@/lib/retainers/retainer-service";

export type ClientSafeProvenanceAccessResult =
  | {
      ok: true;
      subjectType: SupportedDecisionProvenanceSubjectType;
      subjectId: string;
    }
  | {
      ok: false;
      status: 403 | 404 | 422;
      reason:
        | "UNSUPPORTED_SUBJECT_TYPE"
        | "SUBJECT_NOT_FOUND"
        | "SUBJECT_ACCESS_REQUIRED"
        | "ORGANISATION_ACCESS_REQUIRED"
        | "RETAINER_ACCESS_REQUIRED";
    };

function normaliseEmail(value?: string | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

async function hasOrganisationMembership(input: {
  organisationId: string;
  email: string;
}): Promise<boolean> {
  const membership = await prisma.organisationMembership.findFirst({
    where: {
      organisationId: input.organisationId,
      email: input.email,
      status: "active",
    },
    select: { id: true },
  });

  return Boolean(membership);
}

export async function authorizeClientSafeProvenanceSubject(input: {
  subjectType: string;
  subjectId: string;
  viewerEmail?: string | null;
  viewerIsAdmin: boolean;
}): Promise<ClientSafeProvenanceAccessResult> {
  const subjectId = input.subjectId.trim();
  const viewerEmail = normaliseEmail(input.viewerEmail);

  if (!isSupportedDecisionProvenanceSubjectType(input.subjectType)) {
    return {
      ok: false,
      status: 422,
      reason: "UNSUPPORTED_SUBJECT_TYPE",
    };
  }

  if (input.subjectType === "OVERSIGHT_CYCLE") {
    const archive = await loadOversightCycleArchive({ cycleId: subjectId });
    if (!archive) {
      return { ok: false, status: 404, reason: "SUBJECT_NOT_FOUND" };
    }
    if (input.viewerIsAdmin) {
      return { ok: true, subjectType: input.subjectType, subjectId };
    }
    if (!viewerEmail) {
      return { ok: false, status: 403, reason: "SUBJECT_ACCESS_REQUIRED" };
    }
    if (
      archive.record.organisationId
      && !(await hasOrganisationMembership({
        organisationId: archive.record.organisationId,
        email: viewerEmail,
      }))
    ) {
      return { ok: false, status: 403, reason: "ORGANISATION_ACCESS_REQUIRED" };
    }
    const retainerAccess = await verifyRetainerAccess({
      contractId: archive.record.accountId,
      organisationId: archive.record.organisationId ?? null,
      email: viewerEmail,
    });
    if (!retainerAccess.ok) {
      return { ok: false, status: 403, reason: "RETAINER_ACCESS_REQUIRED" };
    }
    return { ok: true, subjectType: input.subjectType, subjectId };
  }

  if (input.subjectType === "RETAINER_ACCOUNT") {
    const contract = await prisma.retainerContract.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        organisationId: true,
      },
    });
    if (!contract) {
      return { ok: false, status: 404, reason: "SUBJECT_NOT_FOUND" };
    }
    if (input.viewerIsAdmin) {
      return { ok: true, subjectType: input.subjectType, subjectId };
    }
    if (!viewerEmail) {
      return { ok: false, status: 403, reason: "SUBJECT_ACCESS_REQUIRED" };
    }
    if (
      contract.organisationId
      && !(await hasOrganisationMembership({
        organisationId: contract.organisationId,
        email: viewerEmail,
      }))
    ) {
      return { ok: false, status: 403, reason: "ORGANISATION_ACCESS_REQUIRED" };
    }
    const retainerAccess = await verifyRetainerAccess({
      contractId: contract.id,
      organisationId: contract.organisationId ?? null,
      email: viewerEmail,
    });
    if (!retainerAccess.ok) {
      return { ok: false, status: 403, reason: "RETAINER_ACCESS_REQUIRED" };
    }
    return { ok: true, subjectType: input.subjectType, subjectId };
  }

  if (input.subjectType === "EXECUTIVE_REPORT") {
    const run = await (prisma as any).executiveReportingRun.findFirst({
      where: {
        OR: [{ id: subjectId }, { runKey: subjectId }],
      },
      select: {
        id: true,
        runKey: true,
        email: true,
      },
      orderBy: { createdAt: "desc" },
    });
    if (!run) {
      return { ok: false, status: 404, reason: "SUBJECT_NOT_FOUND" };
    }
    if (input.viewerIsAdmin || normaliseEmail(run.email) === viewerEmail) {
      return { ok: true, subjectType: input.subjectType, subjectId };
    }
    return { ok: false, status: 403, reason: "SUBJECT_ACCESS_REQUIRED" };
  }

  const deliveries = await listAllDeliveries();
  const matchingDeliveries = deliveries.filter((delivery) =>
    delivery.id === subjectId || delivery.artifactId === subjectId,
  );
  if (matchingDeliveries.length === 0) {
    return { ok: false, status: 404, reason: "SUBJECT_NOT_FOUND" };
  }
  if (
    input.viewerIsAdmin
    || matchingDeliveries.some((delivery) => normaliseEmail(delivery.recipientEmail) === viewerEmail)
  ) {
    return { ok: true, subjectType: input.subjectType, subjectId };
  }
  return { ok: false, status: 403, reason: "SUBJECT_ACCESS_REQUIRED" };
}
