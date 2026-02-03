// components/registry/BaseCard.tsx — HARDENED (Tactical Variant)
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Lock, Clock, Calendar, ArrowRight, Shield } from "lucide-react";
import { safeSlice } from "@/lib/utils/safe";
import type {
  BaseCardProps,
  DocumentCardProps,
  CoverAspect,
  CoverFit,
  CoverPosition,
} from "./types";

// =============================================================================
// INSTITUTIONAL HELPERS
// =============================================================================

function aspectClass(aspect?: CoverAspect | null): string {
  switch (aspect) {
    case "book": return "aspect-[3/4]";
    case "square": return "aspect-square";
    case "wide": default: return "aspect-video";
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).toUpperCase();
  } catch {
    return "";
  }
}

// =============================================================================
// COMPONENT - THE HARDENED BASE CARD
// =============================================================================

const BaseCard: React.FC<BaseCardProps> = ({
  slug,
  title,
  subtitle,
  excerpt,
  description,
  coverImage,
  coverAspect = null,
  coverFit = null,
  coverPosition = "center",
  date,
  tags = [],
  featured = false,
  accessLevel,
  category,
  readingTime,
  isNew = false,
  className = "",
  href,
}) => {
  const isLocked = accessLevel === "inner-circle" || accessLevel === "premium";
  const safeHref = href || `/briefs/${slug}`;
  const displayText = excerpt || description || subtitle || "";
  const displayTags = safeSlice(tags || [], 0, 3);
  const formattedDate = date ? formatDate(date) : "";
  const cardImage = coverImage || "/assets/images/placeholder-brief.webp";

  return (
    <Link
      href={safeHref}
      className={`group relative flex flex-col overflow-hidden border border-white/5 bg-zinc-950 transition-all duration-500 hover:border-amber-500/40 ${className}`}
    >
      {/* Background Status Indicator (Subtle) */}
      {featured && (
        <div className="absolute top-0 right-0 z-30 bg-amber-500 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-tighter text-black">
          Priority Brief
        </div>
      )}

      {/* 1. Cover Sector */}
      <div className={`relative w-full overflow-hidden border-b border-white/5 ${aspectClass(coverAspect)}`}>
        <Image
          src={cardImage}
          alt={title}
          fill
          className={`
            ${coverFit === "contain" ? "object-contain" : "object-cover"} 
            opacity-40 grayscale transition-all duration-700 
            group-hover:scale-105 group-hover:opacity-80 group-hover:grayscale-0
          `}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        
        {/* Tactical Badges */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {isNew && (
            <span className="border border-amber-500/50 bg-black/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-500 backdrop-blur-md">
              Recent
            </span>
          )}
          {isLocked && (
            <span className="flex items-center gap-1 border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-200 backdrop-blur-md">
              <Lock size={10} /> Secure
            </span>
          )}
        </div>
      </div>

      {/* 2. Intelligence Content Sector */}
      <div className="flex flex-1 flex-col p-6">
        {/* Registry Metadata Header */}
        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            {category || "Unclassified"}
          </span>
          <div className="flex items-center gap-3 text-zinc-600">
             {readingTime && (
               <div className="flex items-center gap-1 font-mono text-[9px] uppercase">
                 <Clock size={10} /> {readingTime}
               </div>
             )}
          </div>
        </div>

        {/* Identification */}
        <div className="mb-4">
          <h3 className="font-serif text-xl italic leading-tight text-zinc-100 transition-colors group-hover:text-amber-500">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 italic">
              // {subtitle}
            </p>
          )}
        </div>

        {/* Abstract */}
        <p className="mb-6 line-clamp-3 font-sans text-sm font-light leading-relaxed text-zinc-400 italic">
          "{displayText}"
        </p>

        {/* 3. Archive Footer */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            {formattedDate && (
              <span className="font-mono text-[10px] tracking-tighter text-zinc-500">
                REF: {formattedDate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-amber-500 transition-colors">
            Access <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* Bottom Identity Line */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-amber-500 transition-all duration-500 group-hover:w-full" />
    </Link>
  );
};

export default BaseCard;