// components/AppShell.tsx — FINAL POLISH
// CRITICAL: Admin routes must NOT inherit public Header/Footer.
// Admin routes have their own shell (AppAdminShell/AdminLayout).
// Public nav leaking into admin surfaces breaks the premium operating console standard.
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";

const VaultSearchOverlay = dynamic(
  () => import("@/components/VaultSearchOverlay"),
  { ssr: false }
);

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SessionProvider>
    <div className="relative min-h-screen bg-[#060609] text-white">
      {/* Public Header — suppressed on admin routes.
          Admin routes use AppAdminShell/AdminLayout which have their own header. */}
      {!isAdminRoute && <Header />}

      <div className="relative z-10 min-h-screen">
        {children}
      </div>

      {/* Public Footer — suppressed on admin routes.
          Admin routes have their own footer or none needed. */}
      {!isAdminRoute && <EnhancedFooter />}

      <VaultSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <div className="aol-grain-overlay" />
    </div>
    </SessionProvider>
  );
}