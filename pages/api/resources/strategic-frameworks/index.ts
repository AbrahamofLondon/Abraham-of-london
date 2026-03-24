// pages/api/resources/strategic-frameworks/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "./[...slug]";

// Allow: /api/resources/strategic-frameworks
// Treat as /api/resources/strategic-frameworks/index
export default function index(req: NextApiRequest, res: NextApiResponse) {
  (req.query as Record<string, unknown>).slug = ["index"];
  return handler(req, res);
}