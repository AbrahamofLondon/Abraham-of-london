// pages/api/pdfs/[id]/metadata.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeParseMetadata(raw: unknown): JsonRecord {
  if (typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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

  const updatesRaw: unknown = req.body;
  if (!isRecord(updatesRaw)) {
    return res.status(400).json({ error: "Invalid metadata payload" });
  }

  try {
    const record = await prisma.contentMetadata.findUnique({
      where: { slug: id },
    });

    if (!record) {
      return res.status(404).json({ error: "PDF not found in registry" });
    }

    const currentMetadata: JsonRecord = safeParseMetadata(record.metadata);

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
    ] as const;

    const newMetadata: JsonRecord = { ...currentMetadata };
    const topLevelUpdates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updatesRaw, field)) {
        const value = updatesRaw[field];
        newMetadata[field] = value;

        if (field === "title" && typeof value === "string") {
          topLevelUpdates.title = value;
        }

        if (field === "description" && typeof value === "string") {
          topLevelUpdates.summary = value;
        }

        if (field === "category" && typeof value === "string") {
          topLevelUpdates.contentType = value;
        }
      }
    }

    const updated = await prisma.contentMetadata.update({
      where: { slug: id },
      data: {
        ...topLevelUpdates,
        metadata: JSON.stringify(newMetadata),
      },
    });

    return res.status(200).json({
      success: true,
      pdf: updated,
      slug: updated.slug,
    });
  } catch (error) {
    console.error(`[PDF Metadata] Error for ${id}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}