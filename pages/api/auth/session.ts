// pages/api/auth/session.ts (update to include new roles)
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import type { User, UserRole } from '@/types/auth';

// Mock user database (replace with your actual DB)
const USERS_DB: User[] = [
  // Your existing users...
  {
    id: 'admin_001',
    email: 'admin@abrahamoflondon.org',
    name: 'System Admin',
    role: 'admin',
    permissions: getPermissionsForRole('admin')
  },
  // Inner circle users
  {
    id: 'inner_001',
    email: 'member@innercircle.org',
    name: 'Inner Circle Member',
    role: 'inner-circle',
    permissions: getPermissionsForRole('inner-circle'),
    membershipDate: '2024-01-01',
    lastAccess: new Date().toISOString()
  },
  // More users...
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(200).json({ user: null });
  }

  // Find user in database (in production, query your DB)
  const userData = USERS_DB.find(u => u.email === session.user.email);

  if (!userData) {
    return res.status(200).json({ user: null });
  }

  // Update last access
  userData.lastAccess = new Date().toISOString();

  return res.status(200).json({
    user: userData
  });
}