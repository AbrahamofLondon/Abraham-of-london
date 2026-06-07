import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/options";
import {
  createGmiBoardPackArtifact,
  releaseSnapshotStateHash,
  type GmiBoardPackArtifactType,
} from "@/lib/intelligence/gmi-board-pack-artifact-service.server";
import { getLatestSnapshot } from "@/lib/intelligence/gmi-release-authority";
import { getGmiProvenanceState } from "@/lib/intelligence/gmi-data-service.server";

type Response = {
  ok: boolean;
  error?: string;
  artifact?: {
    id: string;
    editionId: string;
    snapshotId: string | null;
    artifactType: string;
    fileName: string;
    contentHash: string;
    generatedFromStateHash: string;
    generatedAt: string;
    status: string;
  };
};

function artifactType(value: unknown): GmiBoardPackArtifactType {
  return value === "board_pulse_pdf" ? "board_pulse_pdf" : "board_pack_pdf";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await getServerSession(req, res, authOptions);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  if (!session?.user?.email || session.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(403).json({ ok: false, error: "ADMIN_REQUIRED" });
  }

  const editionId = typeof req.body?.editionId === "string" && req.body.editionId.trim()
    ? req.body.editionId.trim()
    : "GMI-Q2-2026";
  const snapshotId = typeof req.body?.snapshotId === "string" && req.body.snapshotId.trim()
    ? req.body.snapshotId.trim()
    : null;

  const provenance = await getGmiProvenanceState(editionId);
  if (!provenance.data.isDataDerived) {
    return res.status(409).json({ ok: false, error: "GMI_DATA_NOT_DERIVED" });
  }

  let generatedFromStateHash: string | null = null;
  if (snapshotId) {
    const snapshot = await getLatestSnapshot(editionId);
    if (!snapshot || snapshot.id !== snapshotId) {
      return res.status(404).json({ ok: false, error: "SNAPSHOT_NOT_FOUND" });
    }
    generatedFromStateHash = releaseSnapshotStateHash(snapshot);
  }

  try {
    const artifact = await createGmiBoardPackArtifact({
      editionId,
      snapshotId,
      artifactType: artifactType(req.body?.artifactType),
      generatedBy: session.user.email,
      generatedFromStateHash,
    });

    return res.status(200).json({
      ok: true,
      artifact: {
        id: artifact.id,
        editionId: artifact.editionId,
        snapshotId: artifact.snapshotId,
        artifactType: artifact.artifactType,
        fileName: artifact.fileName,
        contentHash: artifact.contentHash,
        generatedFromStateHash: artifact.generatedFromStateHash,
        generatedAt: artifact.generatedAt,
        status: artifact.status,
      },
    });
  } catch (error) {
    console.error("[gmi-generate-board-pack]", error);
    return res.status(500).json({ ok: false, error: "BOARD_PACK_GENERATION_FAILED" });
  }
}
