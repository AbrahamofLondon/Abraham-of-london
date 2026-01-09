// lib/auth/options.ts - Simple version
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Simple session-based auth (compatible with your existing system)
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Simple authentication (extend with your actual user database)
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        // Check for admin users
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
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-this",
};

// Simple session helper
export async function getAuthSession() {
  // This would be implemented with getServerSession
  // For now, return null to avoid build errors
  return null;
}