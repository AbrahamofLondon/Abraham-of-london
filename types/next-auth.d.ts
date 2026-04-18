import "next-auth";
import "next-auth/jwt";
import type { AccessTier, EffectiveAccess } from "@/lib/access/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "USER" | "ADMIN" | "OWNER";
      accessTier?: AccessTier;
      entitlements?: EffectiveAccess["entitlements"];
      access?: EffectiveAccess;
    };
  }

  interface User {
    role?: "USER" | "ADMIN" | "OWNER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN" | "OWNER";
  }
}
