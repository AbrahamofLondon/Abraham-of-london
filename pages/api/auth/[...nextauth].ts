import NextAuth, {
  type NextAuthOptions,
} from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

import { normalizeUserTier } from "@/lib/access/tier-policy";

// Augment User with fields provided by the auth flow.
// Session and JWT are already augmented globally in types/next-auth.d.ts.
declare module "next-auth" {
  interface User {
    innerCircleAccess?: boolean;
    isInternal?: boolean;
    allowPrivate?: boolean;
    memberId?: string | null;
    emailHash?: string | null;
    flags?: string[];
  }
}

const resend = new Resend(process.env.RESEND_API_KEY?.trim() || "");

const MAIL_FROM =
  process.env.EMAIL_FROM?.trim() ||
  process.env.MAIL_FROM?.trim() ||
  "Abraham of London <info@abrahamoflondon.org>";

export const authOptions: NextAuthOptions = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: MAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        try {
          await resend.emails.send({
            from: MAIL_FROM,
            to: [identifier],
            bcc: ["info@abrahamoflondon.org"],
            subject: "Institutional Briefing Access // Abraham of London",
            html: `
              <div style="font-family: Georgia, serif; background: #000; color: #fff; padding: 40px; border: 1px solid #333;">
                <h2 style="font-style: italic; margin-bottom: 12px;">Access Protocol Initiated</h2>
                <p style="color: #999; font-family: monospace; font-size: 12px; letter-spacing: 2px;">
                  SECURE LINK GENERATED
                </p>
                <p>
                  Click
                  <a href="${url}" style="color: #10b981; text-decoration: none; border-bottom: 1px solid #10b981;">
                    here
                  </a>
                  to verify your identity and enter the vault.
                </p>
                <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
                <p style="font-size: 10px; color: #444;">
                  ID: ${identifier} // 2026 Sovereign Audit
                </p>
              </div>
            `,
          });
        } catch (error) {
          console.error("[RESEND_AUTH_ERROR]", error);
          throw new Error("FAILED_TO_SEND_VERIFICATION_PROTOCOL");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = String(user.id || "");
        token.role = user.role || "user";

        const canonicalTier = normalizeUserTier(user.tier);

        token.aol = {
          tier: canonicalTier,
          innerCircleAccess: Boolean(user.innerCircleAccess),
          isInternal: Boolean(user.isInternal),
          allowPrivate: Boolean(user.allowPrivate),
          memberId: user.memberId || null,
          emailHash: user.emailHash || null,
          flags: Array.isArray(user.flags) ? user.flags : [],
        };
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        if (token.id) session.user.id = token.id;
        if (token.role) session.user.role = token.role;

        if (token.aol) {
          session.user.tier = token.aol.tier;
          session.aol = { ...token.aol };
        }
      }

      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/auth/login",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);