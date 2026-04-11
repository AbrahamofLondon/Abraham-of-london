import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Note: We use the exact field names and types from your schema
    const interventions = await prisma.contentMetadata.findMany({
      where: {
        contentType: "Briefs",
        classification: "client",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        version: true,
        updatedAt: true,
        // Including counts for UI-richness in the intervention list
        viewCount: true,
        downloadCount: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: interventions,
    });
  } catch (error) {
    console.error("[INTERVENTIONS_API_ERROR]", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve constitutional interventions.",
    });
  }
}