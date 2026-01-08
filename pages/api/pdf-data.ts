// pages/api/pdf-data.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Use dynamic import to avoid build-time issues
    const mod = await import("@/scripts/index");
    const data = await mod.getPdfData?.();
    res.status(200).json({ ok: true, data: data ?? null });
  } catch (error) {
    console.error("PDF data error:", error);
    res.status(500).json({ ok: false, error: "Failed to generate PDF data" });
  }
}