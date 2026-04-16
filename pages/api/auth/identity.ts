// pages/api/auth/identity.ts — CANONICAL IDENTITY ENDPOINT
// (auth-migration/01-target-architecture.md)
//
// Returns the server-resolved identity for the current request.
// This is the ONLY endpoint client code should call for auth state.
// Replaces: /api/auth/session + /api/inner-circle/access + /api/access/check
// as separate scattered queries.

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity, type ResolvedIdentity } from "@/lib/auth/resolve-identity";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResolvedIdentity | { ok: false; error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const identity = await resolveIdentity(req);

    // Cache briefly — identity changes on login/logout but can be
    // cached for a few seconds to avoid hammering the DB on rapid
    // client-side renders.
    res.setHeader("Cache-Control", "private, max-age=5, stale-while-revalidate=10");

    return res.status(200).json(identity);
  } catch (error) {
    console.error("[auth/identity] Resolution error:", error);
    return res.status(500).json({ ok: false, error: "Identity resolution failed" });
  }
}
