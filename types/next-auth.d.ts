import "next-auth";
import "next-auth/jwt";
import type { AccessTier } from "@/lib/access/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      accessTier?: AccessTier;
      entitlements?: {
        tiers: AccessTier[];
        products: string[];
        artifacts: string[];
      };
    };
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}