// components/AppShell.tsx — CLIENT WRAPPER FOR GLOBAL UI
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
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
    <div className="relative min-h-screen bg-black text-white">
      <Header />

      <div className="relative z-10 min-h-screen">
        {children}
      </div>

      <EnhancedFooter />

      <VaultSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <div className="pointer-events-none fixed inset-0 z-[99] bg-[url('/assets/images/grain.png')] opacity-[0.03] mix-blend-overlay" />
    </div>
  );
}