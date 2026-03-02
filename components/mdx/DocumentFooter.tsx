import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface DocumentFooterProps {
  children?: React.ReactNode; // ADDED for custom content
  version?: string;
  id?: string;
  series?: string;
  backLink?: string;
  backText?: string;
  className?: string;
}

export default function DocumentFooter({ 
  children, // ADDED
  version, 
  id, 
  series,
  backLink = "/vault",
  backText = "Back to Vault Index",
  className = "" 
}: DocumentFooterProps) {
  return (
    <footer className={`mt-16 pt-8 border-t border-white/10 ${className}`}>
      {/* Custom children content (for rich footers) */}
      {children && (
        <div className="mb-6 text-white/30 text-sm leading-relaxed">
          {children}
        </div>
      )}
      
      {/* Metadata row */}
      {(version || id || series) && (
        <div className="flex flex-wrap justify-between gap-4 text-xs text-white/40 font-mono mb-8">
          {version && <span>Version: {version}</span>}
          {id && <span>Institutional ID: {id}</span>}
          {series && <span>Part of the {series}</span>}
        </div>
      )}
      
      {/* Back link */}
      <Link 
        href={backLink}
        className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-amber-300 transition-colors group"
      >
        <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
        {backText}
      </Link>
    </footer>
  );
}