// lib/auth/client.ts - Client-safe auth utilities
import { useSession } from "next-auth/react";

// Only export client-safe utilities
export function useUserTier() {
  const { data: session } = useSession();
  return (session?.user as any)?.tier ?? "public";
}

export function useIsAuthenticated() {
  const { status } = useSession();
  return status === "authenticated";
}

// Re-export types only (no server code)
export type { Session } from "next-auth";