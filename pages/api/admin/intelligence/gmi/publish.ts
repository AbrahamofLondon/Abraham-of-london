/* pages/api/admin/intelligence/gmi/publish.ts — PHASE 3+8: Atomic Publication Flow */
/* Strategic rule: returns 409 with blocked snapshot if not publishable. */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { assertGmiEditionPublishable, buildGmiReleaseSnapshot } from "@/lib/intelligence/gmi-release-authority";
import { buildGmiControlPlane } from "@/lib/intelligence/gmi-control-plane";
import { getMarketIntelligenceRecord } from "@/lib/intelligence/market-intelligence-lifecycle";

type Response = {
  ok: boolean;
  snapshotId?: string;
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
  const publishable = assertGmiEditionPublishable(editionId);

  if (!publishable.ok) {
    // Persist blocked snapshot — failed publish attempts are audit records
    const blockedSnapshot = buildGmiReleaseSnapshot(editionId, {
      createdBy: session.user.email,
      persist: true,
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
    const snapshot = buildGmiReleaseSnapshot(editionId, {
      createdBy: session.user.email,
      publishedBy: session.user.email,
      persist: true,
    });

    // 3. Mark edition published via lifecycle record
    const { prisma } = await import("@/lib/prisma");
    const record = getMarketIntelligenceRecord(editionId);
    if (record?.id) {
      await prisma.$executeRaw`
        UPDATE market_intelligence_records
        SET lifecycle_state = 'PUBLISHED', updated_at = NOW()
        WHERE id = ${record.id}
      `;
    }

    // 4. Update governance state
    await prisma.$executeRaw`
      UPDATE gmi_edition_governance_state
      SET publication_status = 'published', updated_at = NOW()
      WHERE edition_id = ${editionId}
    `;

    // 5. Emit governance event
    console.log("[GMI_PUBLISH]", {
      action: "GMI_EDITION_PUBLISHED",
      editionId,
      actor: session.user.email,
      snapshotId: snapshot.id,
      methodologyVersion: snapshot.methodologyVersion,
      rubricVersion: snapshot.rubricVersion,
    });

    // 6. Revalidate public routes
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
      status: "PUBLISHED",
      canPublish: true,
    });
  } catch (error) {
    console.error("[gmi-publish]", error);
    return res.status(500).json({ ok: false, error: "PUBLISH_FAILED" });
  }
}