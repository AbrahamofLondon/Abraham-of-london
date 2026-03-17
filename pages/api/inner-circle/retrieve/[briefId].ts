/* ./pages/api/inner-circle/retrieve/[briefId].ts — STREAMING WATERMARKED ASSET */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PdfService } from "@/lib/server/services/pdf-service";
import { AuditService } from "@/lib/server/services/audit-service";
import { BRIEF_REGISTRY } from "@/lib/briefs/registry";

type SessionUserLike = {
  id?: string;
  email?: string | null;
  role?: string;
};

function firstForwardedIp(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "0.0.0.0";
  if (!value) return "0.0.0.0";
  return value.split(",")[0]?.trim() || "0.0.0.0";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  const briefId = String(req.query?.briefId || "").trim();

  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as SessionUserLike | undefined;

  if (!session || !user || user.role !== "INNER_CIRCLE") {
    return res.status(403).json({ error: "Clearance Denied" });
  }

  if (!briefId) {
    return res.status(400).json({ error: "Invalid Asset ID" });
  }

  const asset = BRIEF_REGISTRY.find((b) => String(b.id) === briefId);
  if (!asset) {
    return res.status(404).json({ error: "Asset Not Found" });
  }

  const memberId = String(user.id || "").trim();
  const email = String(user.email || "").trim();

  if (!memberId || !email) {
    return res.status(403).json({ error: "Incomplete session identity" });
  }

  try {
    const storageUrl = String(process.env.STORAGE_URL || "").replace(/\/+$/, "");
    if (!storageUrl) {
      return res.status(500).json({ error: "Storage not configured" });
    }

    const upstream = await fetch(
      `${storageUrl}/vault/${encodeURIComponent(briefId)}.pdf`
    );

    if (!upstream.ok) {
      return res.status(404).json({ error: "Asset Source Not Found" });
    }

    const pdfBuffer = await upstream.arrayBuffer();

    const watermarkedPdf = await PdfService.injectWatermark(
      Buffer.from(pdfBuffer),
      email
    );

    await AuditService.recordDownload({
      briefId: asset.id,
      memberId,
      email,
      ip:
        firstForwardedIp(req.headers["x-forwarded-for"]) ||
        req.socket.remoteAddress ||
        "0.0.0.0",
      success: true,
      latencyMs: Date.now() - startTime,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asset.id}_SECURED.pdf"`
    );
    res.setHeader("Cache-Control", "private, no-store, max-age=0");

    return res.send(Buffer.from(watermarkedPdf));
  } catch (error) {
    console.error("Retrieval Error:", error);

    try {
      await AuditService.recordDownload({
        briefId: asset.id,
        memberId,
        email,
        ip:
          firstForwardedIp(req.headers["x-forwarded-for"]) ||
          req.socket.remoteAddress ||
          "0.0.0.0",
        success: false,
        latencyMs: Date.now() - startTime,
      });
    } catch (auditError) {
      console.error("Audit Failure:", auditError);
    }

    return res.status(500).json({ error: "Asset Transmission Failed" });
  }
}