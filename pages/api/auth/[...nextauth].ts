/* pages/api/auth/[...nextauth].ts — V7.1 CANONICAL ALIGNED */
import NextAuth, { type NextAuthOptions, type DefaultSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

// Internal Policy Engine Imports
import { normalizeUserTier, type AccessTier } from "@/lib/access/tier-policy";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * MODULE AUGMENTATION
 * Extends the built-in session/user types so TypeScript recognizes 
 * the 'aol' namespace and 'tier' property.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      tier: AccessTier;
    } & DefaultSession["user"];
    aol: {
      tier: AccessTier;
      innerCircleAccess: boolean;
      isInternal: boolean;
      allowPrivate: boolean;
      memberId: string | null;
      emailHash: string | null;
      flags: string[];
    };
  }

  interface User {
    role?: string;
    tier?: string;
    innerCircleAccess?: boolean;
    isInternal?: boolean;
    allowPrivate?: boolean;
    memberId?: string | null;
    emailHash?: string | null;
    flags?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    aol: {
      tier: AccessTier;
      innerCircleAccess: boolean;
      isInternal: boolean;
      allowPrivate: boolean;
      memberId: string | null;
      emailHash: string | null;
      flags: string[];
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to: identifier,
            subject: "Institutional Briefing Access // Abraham of London",
            html: `
              <div style="font-family: serif; background: #000; color: #fff; padding: 40px; border: 1px solid #333;">
                <h2 style="font-style: italic;">Access Protocol Initiated</h2>
                <p style="color: #999; font-family: monospace; font-size: 12px; letter-spacing: 2px;">SECURE LINK GENERATED</p>
                <p>Click <a href="${url}" style="color: #10b981; text-decoration: none; border-bottom: 1px solid #10b981;">here</a> to verify your identity and enter the vault.</p>
                <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
                <p style="font-size: 10px; color: #444;">ID: ${identifier} // 2026 Sovereign Audit</p>
              </div>
            `,
          });
        } catch (error) {
          console.error("RESEND_AUTH_ERROR", error);
          throw new Error("FAILED_TO_SEND_VERIFICATION_PROTOCOL");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Occurs on initial sign-in
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
        
        // Use the V7.1 Engine to normalize the DB string to a Canonical AccessTier
        const canonicalTier = normalizeUserTier(user.tier);

        token.aol = {
          tier: canonicalTier,
          innerCircleAccess: user.innerCircleAccess || false,
          isInternal: user.isInternal || false,
          allowPrivate: user.allowPrivate || false,
          memberId: user.memberId || null,
          emailHash: user.emailHash || null,
          flags: user.flags || [],
        };
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        // 1. Sync the root user object for frontend ease of use
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.tier = token.aol.tier; // This powers hasAccess(session.user.tier)

        // 2. Sync the Institutional Namespace (SSOT)
        session.aol = {
          ...token.aol
        };
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },
  pages: {
    signIn: "/auth/login",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);