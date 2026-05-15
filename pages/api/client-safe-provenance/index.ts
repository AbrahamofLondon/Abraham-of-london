import type { NextApiRequest, NextApiResponse } from "next";

import { requireAuthenticatedApi } from "@/lib/access/server";
import { loadClientSafeProvenance } from "@/lib/admin/client-safe-provenance-composer";
import { recordProvenanceAuditEvent } from "@/lib/admin/provenance-audit-events";
import { authorizeClientSafeProvenanceSubject } from "@/lib/product/client-safe-provenance-access";

type ClientSafeProvenanceApiResponse =
  | {
      ok: true;
      summary: Awaited<ReturnType<typeof loadClientSafeProvenance>>;
    }
  | {
      ok: false;
      reason:
        | "METHOD_NOT_ALLOWED"
        | "SUBJECT_TYPE_REQUIRED"
        | "SUBJECT_ID_REQUIRED"
        | "UNSUPPORTED_SUBJECT_TYPE"
        | "SUBJECT_NOT_FOUND"
        | "SUBJECT_ACCESS_REQUIRED"
        | "ORGANISATION_ACCESS_REQUIRED"
        | "RETAINER_ACCESS_REQUIRED"
        | "INTERNAL_ERROR";
      message: string;
    };

function queryString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClientSafeProvenanceApiResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      reason: "METHOD_NOT_ALLOWED",
      message: "Only GET is supported.",
    });
  }

  const auth = await requireAuthenticatedApi(req, res);
  if (!auth) return;

  const subjectType = queryString(req.query.subjectType);
  const subjectId = queryString(req.query.subjectId);
  if (!subjectType) {
    return res.status(400).json({
      ok: false,
      reason: "SUBJECT_TYPE_REQUIRED",
      message: "subjectType is required.",
    });
  }
  if (!subjectId) {
    return res.status(400).json({
      ok: false,
      reason: "SUBJECT_ID_REQUIRED",
      message: "subjectId is required.",
    });
  }

  try {
    const access = await authorizeClientSafeProvenanceSubject({
      subjectType,
      subjectId,
      viewerEmail: auth.session?.user?.email ?? null,
      viewerIsAdmin: auth.access.permissions.isAdmin,
    });

    if (!access.ok) {
      const message = access.reason === "UNSUPPORTED_SUBJECT_TYPE"
        ? "Case-specific client-safe provenance is not available for this subject type."
        : access.reason === "SUBJECT_NOT_FOUND"
          ? "No supported provenance subject was found for this reference."
          : "Access to this case-specific provenance summary is not available for the current account.";
      return res.status(access.status).json({
        ok: false,
        reason: access.reason,
        message,
      });
    }

    const summary = await loadClientSafeProvenance({
      subjectType: access.subjectType,
      subjectId: access.subjectId,
    });

    await recordProvenanceAuditEvent({
      action: "CLIENT_SAFE_PROVENANCE_GENERATED",
      source: "CLIENT_SAFE_PROVENANCE_CASE_API",
      subjectType: access.subjectType,
      subjectId: access.subjectId,
      hash: summary.provenanceHash,
      actorId: auth.session?.user?.id ?? null,
    });

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ ok: true, summary });
  } catch (error) {
    console.error("[client-safe-provenance-case]", error);
    return res.status(500).json({
      ok: false,
      reason: "INTERNAL_ERROR",
      message: "Failed to compose client-safe provenance.",
    });
  }
}
