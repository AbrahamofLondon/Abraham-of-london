/* components/admin/AdminGuard.tsx — PROTECT ADMIN ROUTES */
import * as React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { AlertCircle } from "lucide-react";
import { hasAccess, normalizeUserTier } from "@/lib/access/tier-policy";

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (status === "loading") return;

    const user = session?.user as { tier?: string; role?: string } | undefined;
    const tier = normalizeUserTier(user?.tier ?? user?.role ?? "public");
    const isAdmin = hasAccess(tier, "architect");

    if (!session || !isAdmin) {
      setIsAuthorized(false);
      setIsLoading(false);
      
      // Redirect to login with return URL
      if (typeof window !== "undefined") {
        router.replace(`/admin/login?returnTo=${encodeURIComponent(router.asPath)}`);
      }
    } else {
      setIsAuthorized(true);
      setIsLoading(false);
    }
  }, [session, status, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-white/40">
            Verifying credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return fallback || (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full border border-red-500/20 bg-red-500/10 p-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h2 className="font-serif text-xl text-white mb-2">Access Denied</h2>
          <p className="text-sm text-white/40">
            You don't have permission to access this area.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 inline-flex items-center gap-2 rounded border border-white/10 px-6 py-3 text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            Return to Platform
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
