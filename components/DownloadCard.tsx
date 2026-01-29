// components/DownloadCard.tsx
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
  
  // New props for component integration
  useDownloadCTA?: boolean;
  ctaDetails?: Array<{label: string, value: string, icon?: string}>;
  ctaFeatures?: string[];
  ctaRequiresAuth?: boolean;
  pdfFormats?: string[];
};

const DEFAULT_COVER = "/assets/images/downloads/default-download-cover.jpg";

function isGatedHref(href: string): boolean {
  return href.startsWith("/api/downloads/");
}

// Reusable DownloadCTA-like component (inline to avoid circular dependency)
const FeaturedDownloadSection = ({
  title,
  description,
  badge,
  details,
  features,
  downloadUrl,
  requiresAuth,
  fileSize,
  fileFormat,
  buttonText,
  pdfFormats = ["A4", "Letter", "A3"]
}: {
  title: string;
  description: string;
  badge: string;
  details: Array<{label: string, value: string, icon?: string}>;
  features: string[];
  downloadUrl: string | null;
  requiresAuth: boolean;
  fileSize: string;
  fileFormat: string;
  buttonText: string;
  pdfFormats?: string[];
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDownload = async () => {
    if (!downloadUrl) return;
    setIsLoading(true);
    setTimeout(() => {
      window.open(downloadUrl, '_blank');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="relative my-6 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 via-black/50 to-gold/5 p-8 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(245, 158, 11, 0.2) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <span className="inline-block px-4 py-2 rounded-full bg-gold/20 text-gold text-sm font-semibold uppercase tracking-wider mb-4">
            {badge}
          </span>
          
          <h2 className="font-serif text-2xl font-bold text-cream mb-3">{title}</h2>
          <p className="text-lg text-gray-300 leading-relaxed">{description}</p>
        </div>

        {/* Details Grid */}
        {details.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
            {details.map((detail, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                    {detail.icon || '📄'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    {detail.label}
                  </div>
                  <div className="text-sm font-semibold text-cream">
                    {detail.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Features List */}
        {features.length > 0 && (
          <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-cream mb-4 flex items-center gap-2">
              <span className="text-gold">✨</span>
              <span>What's Included</span>
            </h3>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-green-400 text-base mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Download Button */}
        <div className="text-center">
          <button
            onClick={handleDownload}
            disabled={isLoading || requiresAuth}
            className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-gold to-amber-600 text-black font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-gold/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Preparing Download...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                <span>{buttonText}</span>
                <span className="text-xs opacity-80">({fileSize}, {fileFormat})</span>
              </>
            )}
          </button>

          {/* Auth notice */}
          {requiresAuth && (
            <div className="mt-6 p-3 rounded-lg bg-charcoal/50 border border-white/10">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <span>Requires <strong className="text-gold">authenticated access</strong></span>
              </p>
            </div>
          )}

          {/* File info */}
          <div className="mt-4 text-xs text-gray-500 flex flex-wrap items-center justify-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span>Secure download</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>High-quality {fileFormat}</span>
            </span>
            {pdfFormats.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span>{pdfFormats.length} formats available</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  useDownloadCTA = true,
  ctaDetails = [],
  ctaFeatures = [],
  ctaRequiresAuth = false,
  pdfFormats = ["A4", "Letter", "A3"],
}: DownloadCardProps) {
  const detailHref = `/downloads/${slug}`;
  const finalImageSrc = (typeof coverImage === "string" && coverImage) || DEFAULT_COVER;
  const gated = typeof fileHref === "string" && fileHref ? isGatedHref(fileHref) : false;

  // If featured and useDownloadCTA is true, render the DownloadCTA-like component
  if (featured && useDownloadCTA) {
    return (
      <div className={className}>
        <FeaturedDownloadSection
          title={title}
          description={excerpt || ""}
          badge={category ? `${category} • Featured` : "Featured Download"}
          details={ctaDetails}
          features={ctaFeatures}
          downloadUrl={fileHref}
          requiresAuth={ctaRequiresAuth || gated}
          fileSize={size || "2.5 MB"}
          fileFormat="PDF"
          buttonText={gated ? "Unlock Access" : "Download Now"}
          pdfFormats={pdfFormats}
        />
      </div>
    );
  }

  // Original DownloadCard layout for non-featured items
  return (
    <article
      className={clsx(
        "group relative flex overflow-hidden rounded-2xl bg-white transition-all duration-300",
        featured ? "flex-col md:flex-row border border-amber-200 shadow-xl" : "flex-col border border-slate-200 shadow-card hover:shadow-cardHover hover:border-amber-200/50",
        className
      )}
    >
      {/* Image Container */}
      <div
        className={clsx(
          "relative overflow-hidden bg-slate-100",
          featured ? "w-full md:w-2/5 min-h-[260px]" : "w-full aspect-[16/9]"
        )}
      >
        <Link href={detailHref} prefetch={false} className="block w-full h-full" tabIndex={-1}>
           {featured && (
             <div className="absolute top-4 left-4 z-10">
               <span className="inline-flex items-center rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-amber-50 shadow-sm backdrop-blur-sm border border-white/10">
                 Featured Asset
               </span>
             </div>
           )}

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
          
          <div className="absolute inset-0 bg-slate-900/0 transition-colors duration-300 group-hover:bg-slate-900/5" />
        </Link>
      </div>

      {/* Content Container */}
      <div className={clsx("flex flex-1 flex-col", featured ? "p-6 md:p-8" : "p-5")}>
        <div className="flex-1">
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

        {/* Footer */}
        <div className={clsx("flex items-center justify-between pt-6 border-t border-slate-100", featured ? "mt-6" : "mt-4")}>
          <Link
            href={detailHref}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-amber-600"
            prefetch={false}
          >
            Details <ArrowRight className="h-3 w-3" />
          </Link>

          <div className="flex items-center gap-3">
             {gated && (
               <div className="flex items-center gap-1 text-xs font-medium text-amber-600/80 bg-amber-50 px-2 py-1 rounded-md">
                 <Lock className="h-3 w-3" />
                 <span>Inner Circle</span>
               </div>
             )}

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