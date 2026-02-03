// components/Cards/CanonResourceCard.tsx — HARDENED (Archival Resource)
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Lock, BookOpen, ChevronRight, ShieldCheck } from "lucide-react";

import {
  getCardImage,
  getCardImageAlt,
  formatCardDate,
  truncateTags,
  formatTagText,
  isContentLocked,
  getAccessLevelBadge,
  getCardAriaLabel,
} from "./utils";

export interface CanonCardProps {
  canon: {
    slug: string;
    title: string;
    subtitle?: string | null;
    excerpt?: string | null;
    description?: string | null;
    coverImage?: string | null;
    volumeNumber?: number | string | null;
    date?: string | null;
    tags?: string[];
    featured?: boolean;
    accessLevel?: string | null;
    lockMessage?: string | null;
  };
  className?: string;
}

const CanonResourceCard: React.FC<CanonCardProps> = ({
  canon,
  className = "",
}) => {
  const isLocked = isContentLocked(canon.accessLevel ?? null);
  const displayText = canon.excerpt || canon.description || canon.subtitle || "";
  const displayTags = truncateTags(canon.tags || [], 2); // Tighter for tactical grid

  const linkHref = `/canon/${canon.slug}`;
  const imageSrc = getCardImage(canon.coverImage);
  const altText = getCardImageAlt(canon.title, "Canon Resource");
  const dateLabel = formatCardDate(canon.date ?? null);
  const accessBadge = getAccessLevelBadge(canon.accessLevel ?? undefined);

  return (
    <Link
      href={linkHref}
      className={`group relative block border border-white/5 bg-zinc-950 transition-all duration-500 hover:border-amber-500/40 ${className}`}
      aria-label={getCardAriaLabel(canon.title, "Archival Resource")}
    >
      <article className="flex h-full flex-col overflow-hidden">
        {/* 1. VISUAL SECTOR */}
        <div className="relative aspect-video w-full overflow-hidden border-b border-white/5 bg-zinc-900">
          <Image
            src={imageSrc}
            alt={altText}
            fill
            className="object-cover opacity-40 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-80 group-hover:grayscale-0"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          
          {/* Tactical Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

          {/* Badges: Top Row */}
          <div className="absolute inset-x-3 top-3 flex justify-between">
            {canon.featured ? (
              <span className="bg-amber-500 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-black">
                Featured
              </span>
            ) : <div />}
            
            {canon.volumeNumber && (
              <span className="border border-amber-500/20 bg-black/60 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-500 backdrop-blur-md">
                VOL // {String(canon.volumeNumber).padStart(2, '0')}
              </span>
            )}
          </div>

          {/* Access Security Status: Bottom Right */}
          {canon.accessLevel && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 border border-white/10 bg-black/80 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-zinc-300 backdrop-blur-md transition-colors group-hover:border-amber-500/30">
              {isLocked ? <Lock size={10} className="text-amber-600" /> : <ShieldCheck size={10} className="text-emerald-500" />}
              {accessBadge.text}
            </div>
          )}
        </div>

        {/* 2. BODY SECTOR */}
        <div className="flex flex-1 flex-col p-5">
          {/* Registry Header */}
          <div className="mb-4 flex flex-wrap gap-2 border-b border-white/5 pb-3">
            {displayTags.map((tag, idx) => (
              <span key={idx} className="font-mono text-[9px] uppercase tracking-tighter text-zinc-500">
                // {formatTagText(tag)}
              </span>
            ))}
          </div>

          {/* Identification */}
          <div className="mb-4">
            <h3 className="font-serif text-xl italic leading-tight text-white transition-colors group-hover:text-amber-500">
              {canon.title}
            </h3>
            {canon.subtitle && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                {canon.subtitle}
              </p>
            )}
          </div>

          {/* Abstract */}
          {displayText && (
            <p className="mb-6 line-clamp-3 font-sans text-sm font-light leading-relaxed text-zinc-400 italic">
              "{displayText}"
            </p>
          )}

          {/* 3. ARCHIVE FOOTER */}
          <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex flex-col">
              {dateLabel && (
                <time className="font-mono text-[9px] uppercase tracking-tighter text-zinc-600">
                  Ref Date: {dateLabel}
                </time>
              )}
              {isLocked && canon.lockMessage && (
                <span className="font-mono text-[8px] uppercase text-amber-600/80">
                  {canon.lockMessage}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors group-hover:text-amber-500">
              Access <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </article>

      {/* Bottom Identity Line */}
      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-amber-500 transition-all duration-700 group-hover:w-full" />
    </Link>
  );
};

export default CanonResourceCard;