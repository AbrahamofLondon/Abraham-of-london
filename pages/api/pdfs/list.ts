// pages/api/pdfs/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPDFs } from "@/lib/pdf/registry.static";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({
    success: true,
    items: getAllPDFs(),
  });
}