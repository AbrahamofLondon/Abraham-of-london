"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  Lock, 
  Zap, 
  Shield, 
  Activity,
  ChevronRight
} from "lucide-react";
import { MetadataTag } from "@/components/ui/BrandAssets";

const navModules = [
  { name: "The Canon", href: "/canon", id: "01", detail: "Core Doctrine" },
  { name: "Briefings", href: "/shorts", id: "02", detail: "Field Intelligence" },
  { name: "The Vault", href: "/downloads/vault", id: "03", detail: "Technical Assets" },
  { name: "Protocol", href: "/contact", id: "04", detail: "Engagement" },
];

export default function CommandNavigation() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 z-[100] w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/5 transition-all group-hover:bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-500" />
              <div className="absolute inset-0 animate-pulse rounded-lg bg-amber-500/20 blur-sm" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-medium tracking-tight text-white leading-none">
                Abraham <span className="text-white/40">of London</span>
              </span>
              <span className="mt-1 text-[8px] font-mono uppercase tracking-[0.3em] text-amber-500/60">
                Institutional Governance
              </span>
            </div>
          </Link>

          {/* Desktop Module Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navModules.map((module) => (
              <Link
                key={module.id}
                href={module.href}
                className="group relative py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-amber-500/40 group-hover:text-amber-500 transition-colors">
                    {module.id}
                  </span>
                  <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${
                    pathname === module.href ? "text-white" : "text-white/40 group-hover:text-white"
                  }`}>
                    {module.name}
                  </span>
                </div>
                {pathname === module.href && (
                  <div className="absolute -bottom-[25px] left-0 h-[2px] w-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                )}
              </Link>
            ))}
          </nav>

          {/* System Actions */}
          <div className="flex items-center gap-6">
            <Link
              href="/downloads/vault"
              className="hidden md:flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-200 transition-all hover:bg-white/10"
            >
              <Lock className="h-3 w-3" />
              Access Vault
            </Link>
            
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.03] text-white transition-all hover:bg-white/[0.08] lg:hidden"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Command Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-20 z-[99] bg-black/95 backdrop-blur-2xl lg:hidden">
          <div className="flex flex-col p-6 space-y-4">
            <div className="mb-4">
              <MetadataTag icon={Activity}>System Status: Operational</MetadataTag>
            </div>
            {navModules.map((module) => (
              <Link
                key={module.id}
                href={module.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all active:bg-white/[0.05]"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-amber-500/40">{module.id}</span>
                    <span className="text-lg font-bold text-white uppercase tracking-wider">{module.name}</span>
                  </div>
                  <p className="mt-1 ml-7 text-[10px] text-white/30 uppercase tracking-widest">{module.detail}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-amber-500/40" />
              </Link>
            ))}
            <Link
              href="/contact"
              className="flex items-center justify-center gap-3 rounded-2xl bg-amber-500 py-6 text-xs font-black uppercase tracking-[0.3em] text-black"
            >
              <Zap className="h-4 w-4" />
              Initiate Protocol
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}