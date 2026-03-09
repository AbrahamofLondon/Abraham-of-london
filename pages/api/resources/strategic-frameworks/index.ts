// pages/api/resources/strategic-frameworks/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "./[...slug]";

// Allow: /api/resources/strategic-frameworks  (treat as "index")
export default function index(req: NextApiRequest, res: NextApiResponse) {
  // forward to catch-all with a default slug "index"
  (req.query as any).slug = ["index"];
  return handler(req, res);
}