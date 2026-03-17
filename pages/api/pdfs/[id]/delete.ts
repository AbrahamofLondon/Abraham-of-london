// pages/api/pdfs/[id]/delete.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getPDFById } from "@/lib/pdf/registry.static";
import fs from "fs";
import path from "path";

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizePublicRelativePath(input: string): string {
  const cleaned = input.replace(/\\/g, "/").trim();

  // strip leading slash so path.join(process.cwd(), "public", relative) works correctly
  return cleaned.replace(/^\/+/, "");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
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

    const outputPathWeb = safeString((pdf as { outputPathWeb?: unknown }).outputPathWeb);
    const fallbackRelative = `assets/downloads/${safeString((pdf as { id?: unknown }).id, id)}.pdf`;
    const relativePath = normalizePublicRelativePath(outputPathWeb || fallbackRelative);

    const filePath = path.join(process.cwd(), "public", relativePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({
      success: true,
      deleted: fs.existsSync(filePath) ? false : true,
      path: relativePath,
    });
  } catch (error) {
    console.error(`[PDF Delete] Error for ${id}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}