/* pages/api/admin/intelligence/gmi/publish.ts — PHASE 3+8: Atomic Publication Flow */
/* Strategic rule: returns 409 with blocked snapshot if not publishable. */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { createGmiBoardPackArtifact, releaseSnapshotStateHash } from "@/lib/intelligence/gmi-board-pack-artifact-service.server";
import { assertGmiEditionPublishable, createAndPersistGmiReleaseSnapshot, getLatestSnapshot } from "@/lib/intelligence/gmi-release-authority";

type Response = {
  ok: boolean;
  snapshotId?: string;
  artifactId?: string;
  status?: string;
  canPublish?: boolean;
  error?: string;
  blockers?: Array<{ message: string; category: string }>;
};

const ROUTES_TO_REVALIDATE = [
  "/intelligence/gmi",
  "/intelligence/gmi/q2-2026",
  "/intelligence/gmi/calls",
  "/intelligence/gmi/performance",
  "/intelligence/gmi/falsification",
  "/intelligence/gmi/operator-brief",
  "/intelligence/gmi/board-pulse",
  "/intelligence/gmi/post-mortem",
  "/intelligence/gmi/use-cases",
];

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

  const { editionId } = req.body || {};
  if (!editionId) {
    return res.status(400).json({ ok: false, error: "EDITION_ID_REQUIRED" });
  }

  // 1. Resolve release state
  const publishable = await assertGmiEditionPublishable(editionId);

  if (!publishable.ok) {
    // Persist blocked snapshot — failed publish attempts are audit records
    const blockedSnapshot = await createAndPersistGmiReleaseSnapshot(editionId, {
      createdBy: session.user.email,
    });

    return res.status(409).json({
      ok: false,
      error: "EDITION_NOT_PUBLISHABLE",
      canPublish: false,
      snapshotId: blockedSnapshot.id,
      blockers: publishable.blockers.map((b) => ({ message: b.message, category: b.category })),
    });
  }

  try {
    // 2. Create and persist final release snapshot
    const snapshot = await createAndPersistGmiReleaseSnapshot(editionId, {
      createdBy: session.user.email,
      publishedBy: session.user.email,
    });
    const persistedSnapshot = await getLatestSnapshot(editionId);
    if (!persistedSnapshot || persistedSnapshot.id !== snapshot.id) {
      return res.status(500).json({ ok: false, error: "PERSISTED_SNAPSHOT_UNAVAILABLE" });
    }
    const artifact = await createGmiBoardPackArtifact({
      editionId,
      snapshotId: snapshot.id,
      artifactType: "board_pack_pdf",
      generatedBy: session.user.email,
      generatedFromStateHash: releaseSnapshotStateHash(persistedSnapshot),
    });

    // 3. Mark edition published via persisted governance state.
    const { prisma } = await import("@/lib/prisma");
    await prisma.$executeRaw`
      UPDATE "gmi_edition_governance_state"
      SET
        "publication_status" = 'published',
        "board_pack_generated_at" = ${new Date(artifact.generatedAt)},
        "board_pulse_published_at" = COALESCE("board_pulse_published_at", NOW()),
        "operator_brief_published_at" = COALESCE("operator_brief_published_at", NOW()),
        "updated_at" = NOW()
      WHERE "edition_id" = ${editionId}
    `;

    // 4. Emit governance event
    console.log("[GMI_PUBLISH]", {
      action: "GMI_EDITION_PUBLISHED",
      editionId,
      actor: session.user.email,
      snapshotId: snapshot.id,
      artifactId: artifact.id,
      methodologyVersion: snapshot.methodologyVersion,
      rubricVersion: snapshot.rubricVersion,
    });

    // 5. Revalidate public routes
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
      const secret = process.env.REVALIDATION_SECRET || "";
      for (const route of ROUTES_TO_REVALIDATE) {
        await fetch(`${siteUrl}/api/revalidate?secret=${secret}&path=${route}`).catch(() => {});
      }
    } catch {
      // Non-blocking
    }

    return res.status(200).json({
      ok: true,
      snapshotId: snapshot.id,
      artifactId: artifact.id,
      status: "PUBLISHED",
      canPublish: true,
    });
  } catch (error) {
    console.error("[gmi-publish]", error);
    return res.status(500).json({ ok: false, error: "PUBLISH_FAILED" });
  }
}
