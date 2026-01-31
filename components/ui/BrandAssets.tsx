import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * InterfaceCard: The fundamental container for all institutional content.
 */
export function InterfaceCard({ 
  children, 
  className = "", 
  variant = "default" 
}: { 
  children: React.ReactNode; 
  className?: string;
  variant?: "default" | "ghost";
}) {
  const styles = {
    default: "border-white/10 bg-white/[0.02] backdrop-blur-xl",
    ghost: "border-transparent bg-transparent"
  };

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 hover:border-amber-500/30 group ${styles[variant]} ${className}`}>
      {children}
      {/* Subtle bottom scanline animation */}
      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-amber-500/40 transition-all duration-700 group-hover:w-full" />
    </div>
  );
}

/**
 * ProtocolButton: High-contrast call to action.
 */
export function ProtocolButton({ 
  href, 
  children, 
  variant = "primary" 
}: { 
  href: string; 
  children: React.ReactNode; 
  variant?: "primary" | "secondary";
}) {
  const base = "group relative inline-flex items-center justify-center gap-3 rounded-xl px-8 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300";
  const styles = {
    primary: "bg-white text-black hover:bg-amber-400",
    secondary: "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
  };

  return (
    <Link href={href} className={`${base} ${styles[variant]}`}>
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/**
 * MetadataTag: For technical labeling and status markers.
 */
export function MetadataTag({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) {
  return (
    <div className="inline-flex items-center gap-2 rounded border border-white/5 bg-white/[0.02] px-2 py-1">
      {Icon && <Icon className="h-3 w-3 text-amber-500/60" />}
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
        {children}
      </span>
    </div>
  );
}