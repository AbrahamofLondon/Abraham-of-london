import type { NextAuthOptions, User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { hashEmail } from "@/lib/security"; 
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

        // 1. Verify against hashed registry
        const emailHash = hashEmail(credentials.email);
        
        // 2. Master Admin Logic
        const isMasterAdmin = 
          credentials.email === process.env.ADMIN_EMAIL && 
          credentials.password === process.env.ADMIN_PASSWORD;

        if (isMasterAdmin) {
          return {
            id: "directorate_001",
            email: credentials.email,
            name: "Director",
            role: "admin",
          } as AppUser;
        }

        // 3. Database Validation
        const member = await prisma.innerCircleMember.findUnique({
          where: { emailHash },
        });

        if (member && member.status === 'active' && credentials.password === process.env.INTERNAL_ACCESS_CODE) {
           return {
            id: member.id,
            email: member.email || credentials.email,
            name: member.name || "Member",
            role: member.role || "member",
          } as AppUser;
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        const u = user as AppUser;
        token.id = u.id;
        token.email = u.email;
        token.role = u.role;
        
        token.aol = {
          tier: u.role === 'admin' || u.role === 'founder' ? 'internal' : 'private',
          innerCircleAccess: true,
          isInternal: u.role === 'admin' || u.role === 'founder',
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