import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const email = String(req.body?.email || "").trim().toLowerCase();
    const name = String(req.body?.name || "").trim();

    if (!email || !email.includes("@")) return res.status(400).json({ ok: false, error: "Invalid email" });
    if (!name || name.length < 2) return res.status(400).json({ ok: false, error: "Invalid name" });

    // MVP: just log. Later: write to Postgres + issue key + email it.
    console.log("INNER_CIRCLE_REGISTER_REQUEST", { name, email, ts: new Date().toISOString() });

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}