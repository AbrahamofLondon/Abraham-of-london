import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import * as React from "react";
import { Download, FileText, Lock, ArrowRight } from "lucide-react";

type DownloadCardProps = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  fileHref: string | null;

  category?: string | null;
  size?: string;
  featured?: boolean;

  className?: string;
};

const DEFAULT_COVER = "/assets/images/downloads/default-download-cover.jpg";

// ✅ Logic preserved: Checks if the link is an API route (Inner Circle) vs Static File
function isGatedHref(href: string): boolean {
  return href.startsWith("/api/downloads/");
}

export default function DownloadCard({
  slug,
  title,
  excerpt,
  coverImage,
  fileHref,
  category,
  size,
  featured = false,
  className,
}: DownloadCardProps) {
  const detailHref = `/downloads/${slug}`;
  const finalImageSrc = (typeof coverImage === "string" && coverImage) || DEFAULT_COVER;

  // Determine if this is a static file (Download) or a gated API route (Unlock)
  const gated = typeof fileHref === "string" && fileHref ? isGatedHref(fileHref) : false;

  return (
    <article
      className={clsx(
        "group relative flex overflow-hidden rounded-2xl bg-white transition-all duration-300",
        // Featured Layout: Horizontal on desktop, Vertical on mobile
        featured ? "flex-col md:flex-row border border-amber-200 shadow-xl" : "flex-col border border-slate-200 shadow-card hover:shadow-cardHover hover:border-amber-200/50",
        className
      )}
    >
      {/* --- Image Section --- */}
      <div
        className={clsx(
          "relative overflow-hidden bg-slate-100",
          featured ? "w-full md:w-2/5 min-h-[260px]" : "w-full aspect-[16/9]"
        )}
      >
        <Link href={detailHref} prefetch={false} className="block w-full h-full" tabIndex={-1}>
           {/* Featured Badge */}
          {featured && (
             <div className="absolute top-4 left-4 z-10">
               <span className="inline-flex items-center rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-amber-50 shadow-sm backdrop-blur-sm border border-white/10">
                 Featured Asset
               </span>
             </div>
           )}

           {/* Category Badge (Overlay) */}
           {category && !featured && (
             <div className="absolute top-3 left-3 z-10">
               <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm backdrop-blur-md">
                 {category}
               </span>
             </div>
           )}

          <Image
            src={finalImageSrc}
            alt={`Cover image for ${title}`}
            fill
            sizes={featured ? "(max-width: 768px) 100vw, 40vw" : "(max-width: 768px) 100vw, 30vw"}
            className={clsx(
              "object-cover transition-transform duration-700",
              featured ? "group-hover:scale-105" : "group-hover:scale-110"
            )}
            priority={featured}
          />
          
          {/* Subtle Overlay on Hover */}
          <div className="absolute inset-0 bg-slate-900/0 transition-colors duration-300 group-hover:bg-slate-900/5" />
        </Link>
      </div>

      {/* --- Content Section --- */}
      <div className={clsx("flex flex-1 flex-col", featured ? "p-6 md:p-8" : "p-5")}>
        <div className="flex-1">
          {/* Metadata Row */}
          <div className="mb-3 flex items-center gap-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
             {featured && category && (
               <span className="text-amber-600 font-bold">{category}</span>
             )}
             {size && (
               <>
                 {featured && category && <span>•</span>}
                 <span>{size}</span>
               </>
             )}
             <span>PDF</span>
          </div>

          <h3
            className={clsx(
              "font-serif text-slate-900 transition-colors group-hover:text-amber-700",
              featured ? "text-2xl font-bold mb-3" : "text-lg font-semibold mb-2"
            )}
          >
            <Link href={detailHref} prefetch={false} className="outline-none focus:underline">
              {title}
            </Link>
          </h3>

          {excerpt && (
            <p
              className={clsx(
                "text-slate-600 leading-relaxed",
                featured ? "text-base line-clamp-3" : "text-sm line-clamp-2"
              )}
            >
              {excerpt}
            </p>
          )}
        </div>

        {/* --- Actions Footer --- */}
        <div className={clsx("flex items-center justify-between pt-6 border-t border-slate-100", featured ? "mt-6" : "mt-4")}>
          <Link
            href={detailHref}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-amber-600"
            prefetch={false}
          >
            Details <ArrowRight className="h-3 w-3" />
          </Link>

          <div className="flex items-center gap-3">
             {/* Status Indicator */}
             {gated && (
               <div className="flex items-center gap-1 text-xs font-medium text-amber-600/80 bg-amber-50 px-2 py-1 rounded-md">
                 <Lock className="h-3 w-3" />
                 <span>Inner Circle</span>
               </div>
             )}

             {/* Action Button */}
             {fileHref && (
               gated ? (
                 <a
                   href={fileHref}
                   className={clsx(
                     "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all",
                     "bg-slate-900 hover:bg-slate-800 hover:shadow-md"
                   )}
                 >
                   Unlock
                 </a>
               ) : (
                 <a
                   href={fileHref}
                   download
                   target="_blank"
                   rel="noopener noreferrer"
                   className={clsx(
                     "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all shadow-sm",
                     featured 
                       ? "bg-amber-500 text-white hover:bg-amber-600 hover:shadow-amber-200"
                       : "bg-white border border-slate-200 text-slate-700 hover:border-amber-300 hover:text-amber-700"
                   )}
                   onClick={(e) => e.stopPropagation()}
                 >
                   <Download className="h-4 w-4" />
                   {featured && "Download"}
                 </a>
               )
             )}
          </div>
        </div>
      </div>
    </article>
  );
}