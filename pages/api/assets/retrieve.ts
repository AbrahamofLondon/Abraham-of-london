/* pages/api/assets/retrieve.ts — SECURE ASSET GATEKEEPER */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma"; // ✅ Unified import with other working routes
import { auditLogger } from "@/lib/audit/audit-logger";
import { authOptions } from "@/lib/auth/config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Initial Identity Verification
  const session = await getServerSession(req, res, authOptions);
  const { slug } = req.body;

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  // 2. Prisma Singleton Guard
  // Ensures 'prisma' is not null before executing the query
  if (!prisma) {
    console.error("Database Connection Error: Prisma client not initialized.");
    return res.status(500).json({ error: "Database connection failure" });
  }

  try {
    // 3. Locate the Brief in your 75-item Portfolio
    const asset = await prisma.contentMetadata.findUnique({
      where: { slug: String(slug) },
    });

    if (!asset) {
      await auditLogger.log({
        action: "ASSET_NOT_FOUND",
        actorEmail: session.user.email as string,
        resourceId: slug,
        severity: "warning",
        category: "content",
        status: "failure",
        errorMessage: "Requested asset slug does not exist",
      });
      return res.status(404).json({ error: "Asset not found" });
    }

    // 4. Log Successful Authorization via your Tank-Logger
    await auditLogger.log({
      action: "ASSET_RETRIEVAL_AUTHORIZED",
      actorEmail: session.user.email as string,
      resourceId: asset.id,
      resourceName: asset.title,
      category: "content",
      severity: "info",
      status: "success",
      metadata: { 
        slug: asset.slug,
        tier: asset.contentType
      }
    });

    // 5. Generate the Secure Path
    const secureUrl = `${process.env.ASSET_STORAGE_URL}/${asset.slug}.pdf?token=${process.env.ASSET_SECRET}`;

    return res.status(200).json({ 
      url: secureUrl,
      title: asset.title 
    });

  } catch (error) {
    await auditLogger.log({
      action: "ASSET_RETRIEVAL_CRITICAL_FAILURE",
      severity: "critical",
      category: "system",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return res.status(500).json({ error: "Internal security error" });
  }
}
