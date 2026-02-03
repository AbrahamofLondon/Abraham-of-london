// components/lexicon/LexiconCard.tsx — HARDENED (Terminology Variant)
import * as React from "react";
import Link from "next/link";
import { BookOpen, Hash, ExternalLink, ChevronRight } from "lucide-react";
import clsx from "clsx";

type LexiconCardProps = {
  slug: string;
  title: string;
  definition: string;
  category?: string | null;
  tags?: string[] | null;
  className?: string;
  isFeatured?: boolean;
};

export default function LexiconCard({
  slug,
  title,
  definition,
  category,
  tags,
  className,
  isFeatured = false,
}: LexiconCardProps): JSX.Element {
  // Path normalization for the Lexicon sector
  const href = `/lexicon/${slug.replace(/^lexicon\//, "")}`;

  return (
    <article
      className={clsx(
        "group relative flex flex-col overflow-hidden rounded-sm border border-white/5 bg-zinc-950/50 p-6 transition-all duration-500",
        "hover:border-amber-500/40 hover:bg-zinc-900/40 hover:shadow-2xl hover:shadow-amber-500/5",
        isFeatured && "border-amber-500/20 bg-amber-500/[0.02]",
        className
      )}
    >
      {/* Institutional Metadata Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-amber-500/10 text-amber-500">
            <Hash size={14} strokeWidth={3} />
          </div>
          {category && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {category}
            </span>
          )}
        </div>
        {isFeatured && (
          <span className="bg-amber-500 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-tighter text-black">
            Core Term
          </span>
        )}
      </div>

      {/* Term & Definition */}
      <div className="flex-1">
        <h3 className="mb-3 font-serif text-2xl font-bold italic tracking-tight text-white transition-colors group-hover:text-amber-500">
          <Link href={href} className="focus:outline-none">
            {title}
          </Link>
        </h3>
        
        <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400 font-light italic">
          "{definition}"
        </p>
      </div>

      {/* Tags & Taxonomy */}
      {tags && tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="border border-white/5 bg-white/[0.02] px-2 py-0.5 font-mono text-[9px] uppercase tracking-tighter text-zinc-600 transition-colors group-hover:text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer Access */}
      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
        <Link
          href={href}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-all hover:text-amber-500"
        >
          View Context <ChevronRight size={12} />
        </Link>
        
        <BookOpen size={14} className="text-zinc-800 transition-colors group-hover:text-amber-500/20" />
      </div>
    </article>
  );
}