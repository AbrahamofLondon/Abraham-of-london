// pages/api/pdfs/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getPDFById } from "@/lib/pdf/registry.static";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing PDF ID" });
  }

  try {
    const pdf = getPDFById(id);
    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" });
    }

    // Transform to match PDFItem (same as in list)
    const item = {
      id: pdf.id,
      title: pdf.title,
      description: pdf.description || pdf.excerpt || "",
      category: pdf.category || "uncategorized",
      type: pdf.type || "pdf",
      exists: pdf.exists ?? false,
      isGenerating: pdf.isGenerating ?? false,
      error: pdf.error,
      fileUrl: pdf.fileUrl || pdf.outputPathWeb || `/assets/downloads/${pdf.id}.pdf`,
      fileSize: pdf.fileSize || pdf.fileSizeLabel || "0 KB",
      lastGenerated: pdf.lastGenerated || pdf.updatedAt,
      createdAt: pdf.createdAt || pdf.lastModifiedIso || new Date().toISOString(),
      updatedAt: pdf.updatedAt || pdf.lastModifiedIso || new Date().toISOString(),
      tags: pdf.tags || [],
      status: pdf.status || (pdf.exists ? "generated" : "pending"),
      metadata: pdf.metadata || {},
      outputPath: pdf.outputPath || pdf.outputAbsPath,
      downloadCount: pdf.downloadCount || 0,
    };

    return res.status(200).json({ success: true, pdf: item });
  } catch (error) {
    console.error(`[PDF API] Error fetching ${id}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}