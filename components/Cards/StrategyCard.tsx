// components/Cards/StrategyCard.tsx — HARDENED (Strategic Intelligence)
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Globe, Activity, ArrowRight, Target } from "lucide-react";
import clsx from "clsx";

export interface StrategyCardProps {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  date?: string | null;
  category?: string | null;
  featured?: boolean;
  className?: string;
  // Strategic Metadata
  threatLevel?: "Low" | "Guarded" | "Elevated" | "High" | "Severe";
  status?: "Active" | "Archived" | "Under Review" | "Draft";
  region?: string;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
  slug,
  title,
  subtitle,
  excerpt,
  description,
  coverImage,
  date,
  category = "Strategy",
  featured = false,
  className = "",
  threatLevel = "Guarded",
  status = "Active",
  region = "Global",
}) => {
  const linkHref = `/strategy/${slug}`;
  const displayText = excerpt || description || subtitle || "";

  // Threat Level Visual Logic
  const threatColors = {
    Low: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    Guarded: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    Elevated: "text-amber-400 border-amber-400/20 bg-amber-400/5",
    High: "text-orange-500 border-orange-500/20 bg-orange-500/5",
    Severe: "text-red-500 border-red-500/30 bg-red-500/10 animate-pulse",
  };

  return (
    <Link
      href={linkHref}
      className={clsx(
        "group relative flex flex-col overflow-hidden border border-white/5 bg-zinc-950 transition-all duration-500 hover:border-amber-500/40",
        className
      )}
    >
      {/* 1. Header Metadata Bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-2">
        <div className="flex items-center gap-2">
          <Target size={12} className="text-amber-500" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            STRAT-OP // {status}
          </span>
        </div>
        <div className="font-mono text-[9px] text-zinc-600">
          REF: {date ? new Date(date).getFullYear() : "2026"}
        </div>
      </div>

      {/* 2. Visual Sector */}
      <div className="relative aspect-[21/9] w-full overflow-hidden border-b border-white/5">
        <Image
          src={coverImage || "/assets/images/strategy-default.webp"}
          alt={title}
          fill
          className="object-cover opacity-30 grayscale transition-all duration-700 group-hover:scale-110 group-hover:opacity-60 group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        
        {/* Region/Geospatial Tag */}
        <div className="absolute bottom-3 left-4 flex items-center gap-1.5 border border-white/10 bg-black/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-300 backdrop-blur-md">
          <Globe size={10} className="text-amber-500" /> {region}
        </div>
      </div>

      {/* 3. Content Sector */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4">
          <h3 className="font-serif text-2xl italic leading-tight text-white transition-colors group-hover:text-amber-500">
            {title}
          </h3>
          <div className="mt-2 h-px w-12 bg-amber-500/50 transition-all duration-500 group-hover:w-full" />
        </div>

        <p className="mb-8 line-clamp-3 font-sans text-sm font-light leading-relaxed text-zinc-400 italic">
          "{displayText}"
        </p>

        {/* 4. Tactical Status Grid */}
        <div className="mt-auto grid grid-cols-2 gap-px border border-white/5 bg-white/5 overflow-hidden rounded-sm">
          {/* Threat Level */}
          <div className={clsx("flex flex-col gap-1 p-3 transition-colors", threatColors[threatLevel])}>
            <span className="font-mono text-[8px] uppercase tracking-widest opacity-60">Threat Level</span>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold">
              <ShieldAlert size={12} /> {threatLevel.toUpperCase()}
            </div>
          </div>
          
          {/* Activity Status */}
          <div className="flex flex-col gap-1 bg-zinc-950 p-3 text-zinc-400 transition-colors group-hover:bg-zinc-900">
            <span className="font-mono text-[8px] uppercase tracking-widest opacity-60">System State</span>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase">
              <Activity size={12} className="text-amber-500" /> Nominal
            </div>
          </div>
        </div>

        {/* Access Footer */}
        <div className="mt-6 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
            Classified // Strategy Division
          </span>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-amber-500 transition-colors">
            Analysis <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StrategyCard;