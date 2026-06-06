/* pages/api/admin/intelligence/gmi/publish.ts — PHASE 3: Atomic Publication Flow */
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
  error?: string;
  blockers?: Array<{ message: string }>;
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
    return res.status(409).json({
      ok: false,
      error: "EDITION_NOT_PUBLISHABLE",
      blockers: publishable.blockers.map((b) => ({ message: b.message })),
    });
  }

  try {
    // 2. Create release snapshot
    const snapshot = buildGmiReleaseSnapshot(editionId, session.user.email);

    // 3. Mark edition published (via lifecycle record — use raw SQL for type safety)
    const { prisma } = await import("@/lib/prisma");
    const record = getMarketIntelligenceRecord(editionId);
    if (record?.id) {
      await prisma.$executeRaw`
        UPDATE market_intelligence_records
        SET lifecycle_state = 'PUBLISHED', updated_at = NOW()
        WHERE id = ${record.id}
      `;
    }

    // 4. Emit governance event (non-blocking)
    console.log("[GMI_PUBLISH]", {
      action: "GMI_EDITION_PUBLISHED",
      editionId,
      actor: session.user.email,
      snapshotId: snapshot.id,
      methodologyVersion: snapshot.methodologyVersion,
      rubricVersion: snapshot.rubricVersion,
    });

    // 5. Revalidate public routes
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
      for (const route of ROUTES_TO_REVALIDATE) {
        await fetch(`${siteUrl}/api/revalidate?secret=${process.env.REVALIDATION_SECRET || ""}&path=${route}`)
          .catch(() => {});
      }
    } catch {
      // Non-blocking
    }

    return res.status(200).json({
      ok: true,
      snapshotId: snapshot.id,
      status: "PUBLISHED",
    });
  } catch (error) {
    console.error("[gmi-publish]", error);
    return res.status(500).json({ ok: false, error: "PUBLISH_FAILED" });
  }
}
