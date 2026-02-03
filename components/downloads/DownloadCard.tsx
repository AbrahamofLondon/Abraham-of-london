// components/downloads/DownloadCard.tsx — HARDENED (Tactical Asset Variant)
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import * as React from "react";
import { Download, FileText, Lock, ArrowRight, Layers, ShieldCheck, Loader2 } from "lucide-react";

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
  useDownloadCTA?: boolean;
  ctaDetails?: Array<{ label: string; value: string; icon?: React.ReactNode }>;
  ctaFeatures?: string[];
  ctaRequiresAuth?: boolean;
  pdfFormats?: string[];
  pageCount?: number;
};

const DEFAULT_COVER = "/assets/images/downloads/default-download-cover.jpg";

function isGatedHref(href: string): boolean {
  return href.startsWith("/api/downloads/");
}

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
  pageCount,
}: any) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDownload = async () => {
    if (!downloadUrl) return;
    setIsLoading(true);
    // Mimicking secure decryption/preparation
    setTimeout(() => {
      window.open(downloadUrl, "_blank");
      setIsLoading(false);
    }, 1200);
  };

  const finalDetails = [...details];
  if (pageCount && !finalDetails.some((d) => d.label.toLowerCase().includes("page"))) {
    finalDetails.push({
      label: "Length",
      value: `${pageCount} Pages`,
      icon: <Layers className="w-4 h-4" />,
    });
  }

  return (
    <div className="relative my-8 overflow-hidden rounded-sm border border-amber-500/20 bg-zinc-950 p-8 shadow-2xl">
      {/* Tactical Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #f59e0b 1px, transparent 0)`, backgroundSize: '24px 24px' }} 
      />

      <div className="relative z-10">
        <div className="mb-8">
          <span className="inline-block border border-amber-500/30 bg-amber-500/5 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 mb-4">
            {badge}
          </span>
          <h2 className="font-serif text-3xl italic text-white mb-4">{title}</h2>
          <p className="max-w-2xl text-zinc-400 leading-relaxed italic">{description}</p>
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5 mb-8 overflow-hidden rounded-sm">
          {finalDetails.map((detail, index) => (
            <div key={index} className="bg-zinc-950 p-4 transition-colors hover:bg-zinc-900">
              <div className="flex items-center gap-2 mb-2 text-amber-500/60">
                {detail.icon || <FileText size={14} />}
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">{detail.label}</span>
              </div>
              <div className="font-mono text-xs font-bold text-zinc-200">{detail.value}</div>
            </div>
          ))}
        </div>

        {/* Asset Manifest */}
        {features.length > 0 && (
          <div className="mb-10 rounded-sm border border-white/5 bg-white/[0.02] p-6">
            <h3 className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              <ShieldCheck size={14} className="text-amber-500" /> Included Metadata
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
              {features.map((feature : string, index : number) => (
                <li key={index} className="flex items-center gap-3 text-sm text-zinc-400 font-light">
                  <span className="h-1 w-1 bg-amber-500" /> {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Zone */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleDownload}
            disabled={isLoading || requiresAuth}
            className="group relative flex w-full max-w-md items-center justify-center gap-4 border border-amber-500 bg-amber-500 py-4 font-mono text-xs font-bold uppercase tracking-[0.3em] text-black transition-all hover:bg-transparent hover:text-amber-500 disabled:opacity-20"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Download size={18} />
                <span>{buttonText}</span>
              </>
            )}
          </button>
          
          <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-widest text-zinc-600">
             <span>Format: {fileFormat}</span>
             <span>•</span>
             <span>Size: {fileSize}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DownloadCard(props: DownloadCardProps) {
  const { slug, title, excerpt, coverImage, fileHref, category, size, featured, className, useDownloadCTA, pageCount } = props;
  const detailHref = `/downloads/${slug}`;
  const gated = fileHref ? isGatedHref(fileHref) : false;

  if (featured && useDownloadCTA) {
    return (
      <FeaturedDownloadSection
        {...props}
        badge={category ? `${category} // PRIORITY` : "FEATURED ASSET"}
        downloadUrl={fileHref}
        requiresAuth={props.ctaRequiresAuth || gated}
        fileSize={size || "---"}
        fileFormat="PDF"
        buttonText={gated ? "AUTHENTICATE TO UNLOCK" : "INITIALIZE DOWNLOAD"}
        details={props.ctaDetails || []}
        features={props.ctaFeatures || []}
      />
    );
  }

  return (
    <article className={clsx(
      "group relative flex flex-col overflow-hidden rounded-sm border border-white/5 bg-zinc-950 transition-all duration-500 hover:border-amber-500/30",
      className
    )}>
      {/* Tactical Header Image */}
      <div className="relative aspect-video w-full overflow-hidden border-b border-white/5">
        <Image
          src={coverImage || DEFAULT_COVER}
          alt={title}
          fill
          className="object-cover opacity-40 grayscale transition-all duration-700 group-hover:scale-110 group-hover:opacity-70 group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        
        {category && (
          <div className="absolute top-4 left-4 border border-amber-500/30 bg-black/80 px-2 py-1 font-mono text-[9px] uppercase tracking-tighter text-amber-500 backdrop-blur-md">
            {category}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center gap-3 font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
           {size && <span>{size}</span>}
           {pageCount && <span>• {pageCount} PGS</span>}
           {gated && <Lock size={10} className="text-amber-500" />}
        </div>

        <h3 className="mb-4 font-serif text-xl italic text-white group-hover:text-amber-500 transition-colors">
          <Link href={detailHref}>{title}</Link>
        </h3>

        <p className="mb-8 line-clamp-2 text-sm leading-relaxed text-zinc-500 italic">
          {excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
          <Link href={detailHref} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-amber-500">
            METADATA <ArrowRight size={12} />
          </Link>

          {fileHref && (
            <a 
              href={fileHref} 
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-sm transition-all",
                gated ? "bg-zinc-800 text-amber-500" : "bg-amber-500 text-black hover:bg-amber-400"
              )}
            >
              {gated ? <Lock size={14} /> : <Download size={14} />}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}