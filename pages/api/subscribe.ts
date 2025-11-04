import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });
  try {
    const { email } = (req.body ?? {}) as { email?: string };
    if (!email || !/.+@.+\..+/.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    // TODO: integrate with your ESP (Mailerlite/Brevo/etc.)
    return res.status(200).json({ ok: true, message: "Subscribed" });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Server error" });
  }
}
