/* pages/api/admin/intelligence/gmi/snapshot.ts — Create a release snapshot (blocked or ready) */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { createAndPersistGmiReleaseSnapshot } from "@/lib/intelligence/gmi-release-authority";

type Response = {
  ok: boolean;
  snapshotId?: string;
  releaseStatus?: string;
  error?: string;
};

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

  try {
    const snapshot = await createAndPersistGmiReleaseSnapshot(editionId, {
      createdBy: session.user.email,
    });

    return res.status(200).json({
      ok: true,
      snapshotId: snapshot.id,
      releaseStatus: snapshot.releaseStatus,
    });
  } catch (error) {
    console.error("[gmi-snapshot]", error);
    return res.status(500).json({ ok: false, error: "SNAPSHOT_FAILED" });
  }
}
