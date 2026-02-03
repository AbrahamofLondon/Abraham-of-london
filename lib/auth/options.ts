import type { NextAuthOptions, User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { hashEmail } from "@/lib/security"; // Our unified security lib
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// ==================== CUSTOM TYPES ====================
export interface AppUser extends User {
  role?: string;
}

export interface AppSession extends Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
  };
  aol?: {
    tier: string;
    innerCircleAccess: boolean;
    isInternal: boolean;
    allowPrivate: boolean;
  };
}

// ==================== AUTH OPTIONS ====================
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Sovereign Access",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Security Code", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Verify against the Directorate/Member Database
        const emailHash = hashEmail(credentials.email);
        const member = await prisma.innerCircleMember.findUnique({
          where: { emailHash },
        });

        // 2. Initial Admin Fallback (Only for first-time setup or emergency)
        const isMasterAdmin = 
          credentials.email === process.env.ADMIN_EMAIL && 
          credentials.password === process.env.ADMIN_PASSWORD;

        if (isMasterAdmin) {
          return {
            id: "directorate_001",
            email: credentials.email,
            name: "Director",
            role: "admin",
          };
        }

        // 3. Database Check (Logic: if member exists and status is active)
        // Note: For now, we check password. In production, consider Magic Links.
        if (member && member.status === 'active' && credentials.password === process.env.INTERNAL_ACCESS_CODE) {
           return {
            id: member.id,
            email: member.email || credentials.email,
            name: member.name || "Member",
            role: member.role, // This pulls 'admin', 'founder', etc.
          };
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as AppUser).role;
        
        // Sovereign Claims
        token.aol = {
          tier: token.role === 'admin' || token.role === 'founder' ? 'internal' : 'private',
          innerCircleAccess: true,
          isInternal: token.role === 'admin' || token.role === 'founder',
          allowPrivate: true,
        };
      }
      return token;
    },

    async session({ session, token }): Promise<Session> {
      if (session.user && token) {
        const extendedSession = session as AppSession;
        extendedSession.user.id = token.id as string;
        extendedSession.user.role = token.role as string;
        
        if (token.aol) {
          extendedSession.aol = token.aol as any;
        }
        
        return extendedSession;
      }
      return session;
    },
  },

  pages: {
    signIn: "/admin/login",
    signOut: "/",
    error: "/admin/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export async function getAuthSession(): Promise<AppSession | null> {
  const session = await getServerSession(authOptions);
  return session as AppSession | null;
}

export default authOptions;