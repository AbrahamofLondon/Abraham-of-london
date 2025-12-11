// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  // Use JWT strategy (works without database)
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Secret for signing tokens - REQUIRED
  secret: process.env.NEXTAUTH_SECRET || "development-secret-change-this",
  
  // Callbacks
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).email = token.email as string;
      }
      return session;
    },
  },
  
  // Debug mode in development
  debug: process.env.NODE_ENV === "development",
  
  // Theme
  theme: {
    colorScheme: "auto" as const,
    brandColor: "#F59E0B",
    logo: "/logo.png",
  },
  
  // Providers - for now, use a simple credentials provider
  providers: [
    // This is a minimal provider that will allow the API to exist
    // You can replace this with real providers later
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize() {
        // Return null to disable actual authentication for now
        // You can implement real auth later
        return null;
      }
    } as any,
  ],
};

export default NextAuth(authOptions);