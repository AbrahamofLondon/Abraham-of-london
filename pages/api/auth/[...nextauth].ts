// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type LegacyUser = {
  id?: string;
  role?: string;
  tier?: string;
  innerCircleAccess?: boolean;
  isInternal?: boolean;
  allowPrivate?: boolean;
  memberId?: string | null;
  emailHash?: string | null;
  flags?: string[];
};

type SessionUserAugmented = {
  id?: string;
  role?: string;
};

type SessionAugmented = {
  user?: SessionUserAugmented;
  aol?: {
    tier?: string;
    innerCircleAccess?: boolean;
    isInternal?: boolean;
    allowPrivate?: boolean;
    memberId?: string | null;
    emailHash?: string | null;
    flags?: string[];
  };
};

type TokenAugmented = {
  id?: string;
  role?: string;
  aol?: {
    tier?: string;
    innerCircleAccess?: boolean;
    isInternal?: boolean;
    allowPrivate?: boolean;
    memberId?: string | null;
    emailHash?: string | null;
    flags?: string[];
  };
};

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
            subject: "Your Institutional Briefing Access Link",
            html: `<p>Click <a href="${url}">here</a> to access your Abraham of London dashboard.</p>`,
          });
        } catch (error) {
          console.error("RESEND_ERROR", error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const legacyUser = user as LegacyUser;
        const augmentedToken = token as typeof token & TokenAugmented;

        augmentedToken.id = legacyUser.id;
        augmentedToken.role = legacyUser.role || "user";
        augmentedToken.aol = {
          tier: legacyUser.tier || "public",
          innerCircleAccess: legacyUser.innerCircleAccess || false,
          isInternal: legacyUser.isInternal || false,
          allowPrivate: legacyUser.allowPrivate || false,
          memberId: legacyUser.memberId || null,
          emailHash: legacyUser.emailHash || null,
          flags: legacyUser.flags || [],
        };
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        const augmentedSession = session as typeof session & SessionAugmented;
        const augmentedToken = token as typeof token & TokenAugmented;

        if (augmentedSession.user) {
          augmentedSession.user.id = augmentedToken.id || "";
          augmentedSession.user.role = augmentedToken.role || "user";
        }

        augmentedSession.aol = augmentedToken.aol || {
          tier: "public",
          innerCircleAccess: false,
          isInternal: false,
          allowPrivate: false,
          memberId: null,
          emailHash: null,
          flags: [],
        };
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);