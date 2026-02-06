/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPDFItems } from "@/lib/pdf/registry";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // This endpoint now only reports registry state.
  // Generation should happen in scripts (CI/build) not at request time.
  const items = getAllPDFItems({ includeMissing: true });

  return res.status(200).json({
    success: true,
    total: items.length,
    exists: items.filter((x) => x.exists !== false).length,
    items,
  });
}