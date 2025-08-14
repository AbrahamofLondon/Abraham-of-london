// pages/api/newsletter.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }
    console.log(`Subscribed email: ${email}`);
    return res.status(200).json({ message: "Subscribed successfully" });
  }
  return res.status(405).json({ error: "Method not allowed" });
}






