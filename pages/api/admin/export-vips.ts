/* pages/api/admin/export-vips.ts — CSV EXPORT ENGINE */
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@abrahamoflondon.com';

  if (!session || session.user?.email !== adminEmail) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const vips = await prisma.innerCircleMember.findMany({
      select: {
        email: true,
        name: true,
        tier: true,
        status: true,
        lastLoginAt: true,
      },
      orderBy: { lastLoginAt: 'desc' }
    });

    // Generate CSV Header
    const header = "Name,Email,Tier,Status,LastActive\n";
    const rows = vips.map(v => 
      `${v.name},${v.email},${v.tier},${v.status},${v.lastLoginAt?.toISOString() || 'Never'}`
    ).join("\n");

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inner-circle-export.csv');
    return res.status(200).send(header + rows);

  } catch (error) {
    return res.status(500).json({ error: "Export failed" });
  }
}