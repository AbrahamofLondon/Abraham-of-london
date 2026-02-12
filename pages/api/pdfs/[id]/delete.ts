// pages/api/pdfs/[id]/delete.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getPDFById } from "@/lib/pdf/registry.static";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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

    const filePath = path.join(process.cwd(), "public", pdf.outputPathWeb || `/assets/downloads/${pdf.id}.pdf`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Note: The registry is static; deletion only removes the file.
    // If you have a dynamic registry, update it here.

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`[PDF Delete] Error for ${id}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}