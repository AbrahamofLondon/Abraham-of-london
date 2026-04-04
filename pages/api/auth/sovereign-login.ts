import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import crypto from "crypto";

const VALID_KEYS = (process.env.SOVEREIGN_KEYS || "").split(",");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { key } = req.body;

  if (!key || !VALID_KEYS.includes(key)) {
    return res.status(401).json({ ok: false });
  }

  const sessionId = crypto.randomUUID();

  // TODO: persist in DB if needed
  // await prisma.session.create(...)

  res.setHeader(
    "Set-Cookie",
    serialize("aol_access", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  );

  return res.status(200).json({ ok: true });
}