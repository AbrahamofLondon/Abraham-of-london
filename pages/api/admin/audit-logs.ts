/* pages/api/admin/audit-logs.ts — SECURE LOG RETRIEVAL */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { auditLogger } from '@/lib/server/db/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Level 3 Clearance (Admin Only) to view logs
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized. Admin Clearance Required.' });
  }

  try {
    const logs = await auditLogger.getLatestLogs(100);
    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'Database Retrieval Failure' });
  }
}