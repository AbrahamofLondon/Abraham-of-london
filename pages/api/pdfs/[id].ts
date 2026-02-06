// pages/api/pdfs/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPDFItemsServer } from "@/lib/pdf/registry.server";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id || "").trim();
  if (!id) return res.status(400).json({ success: false, error: "Missing id" });

  const items = getAllPDFItemsServer({ includeVaultFs: true });
  const item = items.find((x) => x.id === id);

  if (!item) return res.status(404).json({ success: false, error: "Not found" });

  return res.status(200).json({ success: true, item });
}