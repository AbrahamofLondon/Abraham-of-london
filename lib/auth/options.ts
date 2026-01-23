// lib/auth/options.ts
import type { NextAuthOptions, User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { AoLAccessClaims } from "@/types/next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// ==================== CUSTOM TYPES ====================
export interface AppUser extends User {
  role?: string;
}

export interface AppSession extends Session, AoLAccessClaims {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: string;
  };
}

// ==================== AUTH OPTIONS ====================
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@abrahamoflondon.org';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (credentials.email === adminEmail && credentials.password === adminPassword) {
          return {
            id: "admin_001",
            email: adminEmail,
            name: "Admin User",
            role: "admin",
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
        token.name = user.name || undefined;
        token.role = (user as AppUser).role;
        
        // Add AoL access claims
        token.aol = {
          tier: "private",
          innerCircleAccess: true,
          isInternal: true,
          allowPrivate: true,
        };
      }
      return token;
    },

    async session({ session, token }): Promise<Session> {
      if (session.user && token) {
        // Type-safe extension
        const extendedSession = session as AppSession;
        
        extendedSession.user.id = token.id as string;
        extendedSession.user.email = token.email as string;
        extendedSession.user.name = token.name || null;
        extendedSession.user.role = token.role as string;
        
        // Add AoL claims
        if (token.aol) {
          extendedSession.aol = token.aol;
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
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

// ==================== UTILITY FUNCTIONS ====================
import { getServerSession } from "next-auth/next";

export async function getAuthSession(): Promise<AppSession | null> {
  const session = await getServerSession(authOptions);
  return session as AppSession | null;
}

export default authOptions;