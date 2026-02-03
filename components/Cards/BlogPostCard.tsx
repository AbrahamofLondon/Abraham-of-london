// components/Cards/BlogPostCard.tsx — HARDENED (Tactical Journal)
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, User, Calendar, ArrowUpRight } from "lucide-react";

import {
  getCardImage,
  getCardImageAlt,
  getAuthorName,
  getAuthorPicture,
  truncateTags,
  formatTagText,
  formatShortDate,
  getDisplayText,
  truncateText,
  getCardAriaLabel,
} from "./utils";

export interface BlogPostCardProps {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  date?: string | null;
  author?: string | { name: string; picture?: string } | null;
  tags?: string[];
  featured?: boolean;
  readTime?: string | number | null;
  category?: string | null;
  className?: string;
  href?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({
  slug,
  title,
  subtitle,
  excerpt,
  description,
  coverImage,
  date,
  author,
  tags = [],
  featured = false,
  readTime,
  category,
  className = "",
  href,
}) => {
  const linkHref = href || `/blog/${slug}`;

  const displayTextRaw = getDisplayText(excerpt, description, subtitle);
  const displayText = truncateText(displayTextRaw, 180); // Tighter truncation for tactical UI
  const displayTags = truncateTags(tags, 2); // Less is more in a hardened UI

  const authorName = getAuthorName(author ?? null);
  const authorPicture = getAuthorPicture(author ?? null);
  const dateLabel = formatShortDate(date ?? null);

  const readTimeText =
    typeof readTime === "number" ? `${readTime} MIN READ` : readTime?.toString().toUpperCase() || null;

  const imageSrc = getCardImage(coverImage);
  const altText = getCardImageAlt(title, "Intel Dispatch");

  return (
    <Link
      href={linkHref}
      className={`group relative block overflow-hidden border border-white/5 bg-zinc-950 transition-all duration-500 hover:border-amber-500/30 ${className}`}
      aria-label={getCardAriaLabel(title, "Intelligence Dispatch")}
    >
      <article className="flex h-full flex-col">
        {/* IMAGE SECTOR (Institutional Grayscale) */}
        <div className="relative aspect-video w-full overflow-hidden border-b border-white/5 bg-zinc-900">
          <Image
            src={imageSrc}
            alt={altText}
            fill
            className="object-cover opacity-50 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-80 group-hover:grayscale-0"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          
          {/* Tactical Badge Overlays */}
          <div className="absolute inset-x-4 top-4 flex justify-between">
            {featured ? (
              <span className="bg-amber-500 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-black">
                Featured Dispatch
              </span>
            ) : <div />}
            
            {category && (
              <span className="border border-white/10 bg-black/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 backdrop-blur-md">
                {category}
              </span>
            )}
          </div>
        </div>

        {/* BODY SECTOR */}
        <div className="flex flex-1 flex-col p-6">
          {/* META HEADER */}
          <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex gap-2">
              {displayTags.map((tag, idx) => (
                <span key={idx} className="font-mono text-[9px] uppercase tracking-tighter text-amber-500/70">
                  #{formatTagText(tag)}
                </span>
              ))}
            </div>
            {readTimeText && (
              <div className="flex items-center gap-1 font-mono text-[9px] text-zinc-600">
                <Clock size={10} /> {readTimeText}
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="mb-6 flex-1">
            <h3 className="mb-2 font-serif text-xl italic leading-tight text-white transition-colors group-hover:text-amber-500">
              {title}
            </h3>
            {subtitle && (
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 italic">
                // {subtitle}
              </p>
            )}
            {displayText && (
              <p className="line-clamp-3 font-sans text-sm font-light leading-relaxed text-zinc-400 italic">
                "{displayText}"
              </p>
            )}
          </div>

          {/* AUTHOR/DATE FOOTER */}
          <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              {authorPicture ? (
                <div className="relative h-7 w-7 border border-white/10 p-0.5 grayscale group-hover:grayscale-0 transition-all">
                  <Image
                    src={authorPicture}
                    alt={authorName || "Correspondent"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center border border-white/10 bg-zinc-900 text-zinc-600">
                  <User size={12} />
                </div>
              )}
              <div className="flex flex-col leading-none">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                  {authorName || "Staff Correspondent"}
                </span>
                <time className="font-mono text-[9px] text-zinc-600">
                  {dateLabel || "UNDATED"}
                </time>
              </div>
            </div>

            <div className="text-zinc-700 transition-colors group-hover:text-amber-500">
              <ArrowUpRight size={16} />
            </div>
          </div>
        </div>
      </article>

      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-amber-500 transition-all duration-500 group-hover:w-full" />
    </Link>
  );
};

export default BlogPostCard;