/* components/auth/with-sovereign-auth.tsx */

"use client";

import { useEffect, useState } from "react";
import { useOGRStore } from "@/store/useOGRStore";
import { LoginView } from "./login-view";

export function withSovereignAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const isAuthenticated = useOGRStore((state) => state.isAuthenticated);
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!isAuthenticated) {
      return <LoginView />;
    }

    return <Component {...props} />;
  };
}