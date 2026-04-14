import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

  const body: unknown = req.body;
  const title =
    isRecord(body) && typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    return res.status(400).json({ error: "Invalid title" });
  }

  try {
    const record = await prisma.contentMetadata.findUnique({
      where: { slug: id },
    });

    if (!record) {
      return res.status(404).json({ error: "PDF not found in registry" });
    }

    const existingMetadata: JsonRecord = isRecord(record.metadata)
      ? record.metadata
      : {};

    const updated = await prisma.contentMetadata.update({
      where: { slug: id },
      data: {
        title,
        metadata: JSON.stringify({
          ...existingMetadata,
          title,
        }),
      },
    });

    return res.status(200).json({ success: true, pdf: updated });
  } catch (error) {
    console.error(`[PDF Rename] Error for ${id}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}