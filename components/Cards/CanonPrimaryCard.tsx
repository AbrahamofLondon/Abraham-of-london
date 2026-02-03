// components/Cards/CanonPrimaryCard.tsx — HARDENED (Canon/Foundational)
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, ChevronRight } from "lucide-react";
import clsx from "clsx";

interface CanonPrimaryCardProps {
  title: string;
  excerpt?: string;
  href: string;
  image?: string;
  volumeNumber?: number | string;
  className?: string;
}

const CanonPrimaryCard: React.FC<CanonPrimaryCardProps> = ({
  title = "Canon Entry",
  excerpt = "Foundational principles and long-term thinking for builders of legacy.",
  href = "/canon",
  image,
  volumeNumber,
  className = "",
}) => {
  return (
    <Link
      href={href}
      prefetch={false}
      className={clsx(
        "group relative flex flex-col overflow-hidden border border-white/5 bg-zinc-950 transition-all duration-500 hover:border-amber-500/40",
        className
      )}
    >
      {/* 1. ARCHIVAL HEADER */}
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-2">
        <div className="flex items-center gap-2">
          <BookOpen size={12} className="text-amber-500" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            Canon Protocol
          </span>
        </div>
        {volumeNumber && (
          <div className="font-mono text-[9px] font-bold text-amber-500/80">
            VOL // {String(volumeNumber).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* 2. IMAGE SECTOR (Institutional Grayscale) */}
      <div className="relative h-64 w-full overflow-hidden border-b border-white/5">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(min-width: 1024px) 420px, (min-width: 768px) 50vw, 100vw"
            className="object-cover opacity-40 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-70 group-hover:grayscale-0"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
        )}

        {/* Tactical Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        {/* Hover Accent */}
        <div className="absolute inset-0 bg-amber-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      {/* 3. CONTENT SECTOR */}
      <div className="relative flex flex-1 flex-col p-6">
        <h3 className="mb-3 font-serif text-2xl italic leading-tight text-zinc-100 transition-colors group-hover:text-amber-500">
          {title}
        </h3>
        
        {excerpt && (
          <p className="line-clamp-3 font-sans text-sm font-light leading-relaxed text-zinc-400 italic">
            "{excerpt}"
          </p>
        )}

        {/* 4. FOOTER IDENTIFIER */}
        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">
            Institutional Asset
          </span>
          <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors group-hover:text-amber-500">
            Examine <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* Bottom Identity Line */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-amber-500 transition-all duration-700 group-hover:w-full" />
    </Link>
  );
};

export default CanonPrimaryCard;