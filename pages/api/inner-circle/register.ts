/* pages/api/inner-circle/register.ts — STRATEGIC ENROLLMENT */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { hashAccessKey } from "@/lib/server/auth/tokenStore.postgres";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const email = String(req.body?.email || "").trim().toLowerCase();
  const name = String(req.body?.name || "").trim();

  // Basic validation before heavy lifting
  if (!email.includes("@") || email.length > 254) {
    return res.status(400).json({ ok: false, error: "Invalid institutional email" });
  }

  try {
    // 1. Generate a high-entropy Raw Key
    // Format: AL-XXXX-XXXX-XXXX (Institutional Prefix)
    const rawKey = `AL-${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();
    const keyHash = hashAccessKey(rawKey);

    // 2. Transactional creation: Ensures data integrity across Member and Key tables
    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.innerCircleMember.upsert({
        where: { email },
        update: { name }, // Refresh name if they re-register
        create: { 
          email, 
          name, 
          role: "MEMBER", 
          tier: "standard" 
        },
      });

      // Clear old keys if you want to enforce one-key-at-a-time logic
      await tx.innerCircleKey.deleteMany({
        where: { memberId: member.id, status: "active" }
      });

      const key = await tx.innerCircleKey.create({
        data: {
          keyHash,
          memberId: member.id,
          status: "active",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Day Window
        }
      });

      return { member, rawKey };
    });

    // 3. Log the Enrollment (System Logs Only)
    console.log(`[PROVISIONED]: ${email} | Key: ${result.rawKey}`);

    // 4. Return the key to the UI for immediate display
    return res.status(200).json({ 
      ok: true, 
      message: "Enrollment verified. Asset key generated.",
      accessKey: result.rawKey 
    });

  } catch (error) {
    console.error("REGISTRATION_FAILURE:", error);
    return res.status(500).json({ ok: false, error: "Institutional provisioning failed." });
  }
}