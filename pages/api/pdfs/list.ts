// pages/api/pdfs/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getAllPDFs } from "@/lib/pdf/registry.static";
import type { PDFItem, PDFListResponse, DashboardStats } from "@/types/pdf-dashboard";

/**
 * PDF REGISTRY API - INSTITUTIONAL DATA SOURCE
 * Fetches and transforms the 75 intelligence briefs for the Inner Circle dashboard.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PDFListResponse | { error: string }>
) {
  // 1) Strategy: Restrict to GET only
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2) Authentication: Critical Handshake
  // Ensure authOptions matches the secret and configuration used in your proxy.ts
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    console.error(`[AUTH FAILURE] Unauthorized access attempt to PDF Registry from IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
    return res.status(401).json({ error: "Institutional clearance required" });
  }

  try {
    // 3) Fetch briefs from the verified static registry
    const allPDFs = getAllPDFs();

    // 4) Systemic Transformation
    // Mapping raw registry data to the strict PDFItem interface
    const pdfs: PDFItem[] = allPDFs.map((pdf: any) => ({
      id: pdf.id,
      title: pdf.title,
      description: pdf.description || pdf.excerpt || "Classification pending...",
      category: pdf.category || "General Intelligence",
      type: pdf.type || "pdf",
      exists: pdf.exists ?? false,
      isGenerating: pdf.isGenerating ?? false,
      error: pdf.error,
      fileUrl: pdf.fileUrl || `/assets/downloads/${pdf.id}.pdf`,
      fileSize: pdf.fileSize || "0 KB",
      lastGenerated: pdf.lastGenerated || pdf.updatedAt,
      createdAt: pdf.createdAt || new Date().toISOString(),
      updatedAt: pdf.updatedAt || new Date().toISOString(),
      tags: pdf.tags || [],
      status: pdf.status || (pdf.exists ? "generated" : "pending"),
      metadata: pdf.metadata || {},
      outputPath: pdf.outputPath || "",
      downloadCount: pdf.downloadCount || 0,
    }));

    // 5) Pagination Logic
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const startIndex = (page - 1) * limit;
    const paginatedPDFs = pdfs.slice(startIndex, startIndex + limit);

    // 6) Dashboard Intelligence Stats
    const stats: DashboardStats = {
      totalPDFs: pdfs.length,
      availablePDFs: pdfs.filter(p => p.exists && !p.error).length,
      missingPDFs: pdfs.filter(p => !p.exists && !p.error && !p.isGenerating).length,
      categories: Array.from(new Set(pdfs.map(p => p.category))),
      generated: pdfs.filter(p => p.exists && !p.error).length,
      errors: pdfs.filter(p => p.error).length,
      generating: pdfs.filter(p => p.isGenerating).length,
      lastUpdated: new Date().toISOString(),
    };

    // 7) Verified Response
    return res.status(200).json({
      pdfs: paginatedPDFs,
      pagination: {
        page,
        limit,
        total: pdfs.length,
        totalPages: Math.ceil(pdfs.length / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("[VAULT ERROR] Critical failure in PDF List API:", error);
    return res.status(500).json({ error: "Internal Server Error: Registry inaccessible" });
  }
}