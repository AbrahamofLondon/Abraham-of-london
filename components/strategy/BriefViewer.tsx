/* components/strategy/BriefViewer.tsx — SECURE ASSET RENDERING (Router-Free) */
import * as React from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Maximize2, 
  Download, 
  ChevronLeft, 
  FileText,
  Lock
} from "lucide-react";

interface BriefViewerProps {
  assetUrl: string;
  title: string;
  classification: string;
  serialNumber: string;
}

const BriefViewer: React.FC<BriefViewerProps> = ({ 
  assetUrl, 
  title, 
  classification, 
  serialNumber 
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // Prevention of basic inspection/save commands
  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="flex flex-col h-screen bg-[#050505] overflow-hidden select-none">
      {/* 1. TACTICAL HEADER */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black z-20">
        <div className="flex items-center gap-8">
          <Link 
            href="/strategy"
            className="p-2 border border-white/10 hover:border-primary/50 text-zinc-500 hover:text-primary transition-all"
            aria-label="Return to Registry"
          >
            <ChevronLeft size={18} />
          </Link>
          
          <div className="space-y-1">
            <h1 className="text-xl font-editorial italic text-white tracking-tight">
              {title}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono text-primary uppercase tracking-[0.2em]">
                {serialNumber}
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-800" />
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
                Status: Verified Asset
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-red-500/20 bg-red-500/5">
            <ShieldAlert size={12} className="text-red-500 animate-pulse" />
            <span className="text-[9px] font-mono text-red-500 uppercase tracking-widest font-bold">
              {classification}
            </span>
          </div>
          <div className="h-10 w-px bg-white/5" />
          <Lock size={16} className="text-zinc-700" />
        </div>
      </header>

      {/* 2. SECURE VIEWER AREA */}
      <div 
        className="relative flex-1 bg-[#0a0a0a] flex justify-center overflow-auto p-4 md:p-12"
        onContextMenu={handleContextMenu}
      >
        {/* Institutional Watermark Overlay */}
        <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden opacity-[0.03]">
          <div className="rotate-[-45deg] whitespace-nowrap text-[12vw] font-mono uppercase tracking-[1em] text-white">
            Property of Abraham • London • {new Date().getFullYear()}
          </div>
        </div>

        {/* PDF Container */}
        <div className="relative z-0 w-full max-w-5xl shadow-2xl shadow-black h-full min-h-[80vh] bg-white">
          <iframe
            src={`${assetUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-none shadow-gold-glow"
            title={title}
          />
          
          {/* Prevent direct interaction with iframe top-level if needed */}
          <div className="absolute inset-x-0 top-0 h-12 bg-transparent pointer-events-auto" />
        </div>
      </div>

      {/* 3. SYSTEM FOOTER BAR */}
      <footer className="h-12 border-t border-white/5 flex items-center justify-between px-8 bg-black text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-600">
        <div className="flex gap-8">
          <span>Encryption: AES-256-GCM</span>
          <span>Node: LON_SVR_01</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-zinc-800">Do not distribute under penalty of law</span>
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      </footer>
    </div>
  );
};

export default BriefViewer;