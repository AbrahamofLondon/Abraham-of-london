import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
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

  const updates = req.body;
  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ error: "Invalid metadata payload" });
  }

  try {
    const record = await prisma.contentMetadata.findUnique({
      where: { slug: id },
    });

    if (!record) {
      return res.status(404).json({ error: "PDF not found in registry" });
    }

    // Prepare update data
    const currentMetadata = (record.metadata as Record<string, any>) || {};

    // Fields we allow to update (whitelist)
    const allowedFields = [
      "title",
      "description",
      "excerpt",
      "category",
      "tags",
      "author",
      "coverImage",
      "fileSize",
      "downloadCount",
    ];

    const newMetadata = { ...currentMetadata };
    const topLevelUpdates: any = {};

    for (const field of allowedFields) {
      if (field in updates) {
        newMetadata[field] = updates[field];
        // Also update top-level fields if they exist in the model
        if (field === "title") topLevelUpdates.title = updates[field];
        if (field === "description") topLevelUpdates.summary = updates[field];
      }
    }

    // Update the database
    const updated = await prisma.contentMetadata.update({
      where: { slug: id },
      data: {
        ...topLevelUpdates,
        metadata: newMetadata,
      },
    });

    return res.status(200).json({ success: true, pdf: updated });
  } catch (error) {
    console.error(`[PDF Metadata] Error for ${id}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}