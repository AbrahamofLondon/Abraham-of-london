/**
 * pages/api/legal/accept-terms.ts
 *
 * POST /api/legal/accept-terms
 *   Body: { docType: "TERMS" | "PRIVACY"; version: string }
 *   Authenticated. Records or updates the user's acceptance of a legal document version.
 *
 * GET /api/legal/accept-terms?docType=TERMS
 *   Returns the current acceptance record for the authenticated user.
 *
 * This endpoint is called on first authenticated use and whenever a new version
 * of Terms or Privacy is published. It is safe to call repeatedly — idempotent
 * when the version is unchanged.
 *
 * No marketing, no subscription, no third-party sharing.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import {
  recordAcceptance,
  getAcceptance,
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  type DocType,
} from "@/lib/server/terms-acceptance";

type AcceptResponse = {
  ok: true;
  docType: DocType;
  version: string;
  acceptedAt: string;
};

type StatusResponse = {
  ok: true;
  docType: DocType;
  version: string | null;
  acceptedAt: string | null;
  currentVersion: string;
  upToDate: boolean;
};

type ErrorResponse = { error: string };

const VALID_DOC_TYPES: DocType[] = ["TERMS", "PRIVACY"];

function isValidDocType(v: unknown): v is DocType {
  return typeof v === "string" && (VALID_DOC_TYPES as string[]).includes(v);
}

function currentVersion(docType: DocType): string {
  return docType === "TERMS" ? CURRENT_TERMS_VERSION : CURRENT_PRIVACY_VERSION;
}

function getIp(req: NextApiRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  return (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim()
    ?? req.socket?.remoteAddress
    ?? "unknown";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AcceptResponse | StatusResponse | ErrorResponse>,
) {
  const identity = await resolveIdentity(req);
  if (!identity?.email || !identity.subjectId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.method === "GET") {
    const { docType } = req.query;
    if (!isValidDocType(docType)) {
      return res.status(400).json({ error: "docType must be TERMS or PRIVACY" });
    }

    const record = await getAcceptance(identity.subjectId, docType);
    const cv = currentVersion(docType);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      docType,
      version: record?.version ?? null,
      acceptedAt: record?.acceptedAt?.toISOString() ?? null,
      currentVersion: cv,
      upToDate: record?.version === cv,
    });
  }

  if (req.method === "POST") {
    let body: { docType?: unknown; version?: unknown };
    try {
      body =
        typeof req.body === "string"
          ? (JSON.parse(req.body) as typeof body)
          : (req.body as typeof body);
    } catch {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { docType, version } = body;

    if (!isValidDocType(docType)) {
      return res.status(400).json({ error: "docType must be TERMS or PRIVACY" });
    }
    if (typeof version !== "string" || !version.trim()) {
      return res.status(400).json({ error: "version is required" });
    }

    const record = await recordAcceptance({
      userId: identity.subjectId,
      email: identity.email,
      docType,
      version: version.trim(),
      ip: getIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      docType,
      version: record.version,
      acceptedAt: record.acceptedAt.toISOString(),
    });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}

export const config = {
  api: { bodyParser: true },
};
