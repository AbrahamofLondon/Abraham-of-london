// lib/server/auth/admin.ts
import { hash, compare } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export type AdminUser = {
  id: string;
  username: string;
  role: 'admin' | 'superadmin' | 'editor';
  permissions: string[];
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthResult = {
  success: boolean;
  user?: AdminUser;
  error?: string;
  requiresMFA?: boolean;
};

export async function authenticateAdmin(username: string, password: string): Promise<AuthResult> {
  try {
    // Find user in database
    const user = await prisma.adminUser.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
    
    // Verify password using bcrypt
    const isValid = await compare(password, user.passwordHash);
    
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
    
    // Check if MFA is required
    if (user.mfaEnabled) {
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role as any,
          permissions: JSON.parse(user.permissions || '[]'),
          mfaEnabled: true,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        requiresMFA: true
      };
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role as any,
        permissions: JSON.parse(user.permissions || '[]'),
        mfaEnabled: false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
    
  } catch (error) {
    console.error('[AdminAuth] Error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

export async function verifyAdminSession(sessionToken: string): Promise<AdminUser | null> {
  try {
    // In production, use Redis session store
    // For now, decode from JWT or query database
    const session = await prisma.adminSession.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });
    
    if (!session || session.expiresAt < new Date()) {
      return null;
    }
    
    return {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role as any,
      permissions: JSON.parse(session.user.permissions || '[]'),
      mfaEnabled: session.user.mfaEnabled,
      createdAt: session.user.createdAt,
      updatedAt: session.user.updatedAt
    };
  } catch (error) {
    console.error('[AdminAuth] Session verification error:', error);
    return null;
  }
}

// Helper to hash passwords (for user creation)
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}