/* pages/api/admin/diagnostics/artifacts.ts */
import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { readArtifactRegistry } from "@/lib/server/diagnostics/artifact-registry";

type ResponseData =
  | {
      ok: true;
      items: Array<{
        artifactId: string;
        diagnosticRef: string;
        version: string;
        fileName: string;
        mimeType: string;
        byteLength: number;
        sha256: string;
        storageProvider: string;
        objectKey: string;
        createdAt: string;
        createdBy: string | null;
      }>;
    }
  | {
      ok: false;
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const sessionId = readAccessCookie(req);
    if (!sessionId) return res.status(401).json({ ok: false, error: "AUTH_REQUIRED" });

    const ctx = await getSessionContext(sessionId);
    if (!ctx?.ok || !ctx?.valid) {
      return res.status(401).json({ ok: false, error: "SESSION_INVALID" });
    }

    if (!tierAtLeast(String(ctx.tier || "public"), "private")) {
      return res.status(403).json({ ok: false, error: "INSUFFICIENT_CLEARANCE" });
    }

    const registry = readArtifactRegistry();

    return res.status(200).json({
      ok: true,
      items: registry.items
        .slice()
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        .map((item) => ({
          artifactId: item.artifactId,
          diagnosticRef: item.diagnosticRef,
          version: item.version,
          fileName: item.fileName,
          mimeType: item.mimeType,
          byteLength: item.byteLength,
          sha256: item.sha256,
          storageProvider: item.storageProvider,
          objectKey: item.objectKey,
          createdAt: item.createdAt,
          createdBy: item.createdBy ?? null,
        })),
    });
  } catch (error) {
    console.error("[admin/diagnostics/artifacts]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}