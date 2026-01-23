// pages/api/canon/content.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerCanonBySlug } from "@/lib/contentlayer-compat";
import { verifyAccessToken } from "@/lib/server/access/verify-token";

type Ok = { ok: true; raw: string };
type Err = { ok: false; error: string };

function getBearer(req: NextApiRequest): string | null {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const slug = String(req.query.slug || "").trim();
  if (!slug) {
    res.status(400).json({ ok: false, error: "Missing slug" });
    return;
  }

  const token = getBearer(req);
  const tier = verifyAccessToken(token);

  // Must exist
  const canonData: any = await getServerCanonBySlug(slug);
  if (!canonData || canonData.draft) {
    res.status(404).json({ ok: false, error: "Not found" });
    return;
  }

  const accessLevel = String(canonData.accessLevel || "public").toLowerCase();

  // Public: allow without token
  if (accessLevel === "public") {
    const raw = canonData?.body?.raw ?? canonData?.body ?? "";
    res.status(200).json({ ok: true, raw: String(raw || "") });
    return;
  }

  // Locked: require inner/private token
  if (!tier) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  // If content is private, inner-circle token isn't enough
  if (accessLevel === "private" && tier !== "private") {
    res.status(403).json({ ok: false, error: "Forbidden" });
    return;
  }

  const raw = canonData?.body?.raw ?? canonData?.body ?? "";
  res.status(200).json({ ok: true, raw: String(raw || "") });
}