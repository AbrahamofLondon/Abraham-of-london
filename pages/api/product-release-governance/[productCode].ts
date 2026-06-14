import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import type { ProductReleaseGovernance } from "@/lib/product/product-release-governance";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProductReleaseGovernance | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { productCode } = req.query;

  if (!productCode || typeof productCode !== "string") {
    return res.status(400).json({ error: "Product code is required" });
  }

  try {
    // Load governance matrix
    const matrixPath = path.join(process.cwd(), "reports", "product-release-governance-matrix.json");

    if (!fs.existsSync(matrixPath)) {
      return res.status(404).json({ error: "Governance matrix not found" });
    }

    const matrixContent = fs.readFileSync(matrixPath, "utf-8");
    const matrix = JSON.parse(matrixContent);

    const governance: ProductReleaseGovernance | undefined = matrix[productCode];

    if (!governance) {
      return res.status(404).json({ error: `No governance found for product ${productCode}` });
    }

    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).json(governance);
  } catch (error) {
    console.error("Error loading governance:", error);
    return res.status(500).json({ error: "Failed to load governance" });
  }
}
