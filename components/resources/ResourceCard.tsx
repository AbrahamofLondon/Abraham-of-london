// components/resources/ResourceCard.tsx — HARDENED (Asset Archive Variant)
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, ArrowRight, Bookmark } from 'lucide-react';
import { safeSlice } from "@/lib/utils/safe";

interface ResourceCardProps {
  title: string;
  description: string;
  type: 'ebook' | 'whitepaper' | 'template' | 'guide' | 'toolkit';
  downloadCount: number;
  image: string;
  slug: string;
  isFeatured?: boolean;
  tags?: string[];
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  title,
  description,
  type,
  downloadCount,
  image,
  slug,
  isFeatured = false,
  tags = [],
}) => {
  // Institutional Type Mapping
  const typeLabels = {
    ebook: 'VOLUME',
    whitepaper: 'WHITE PAPER',
    template: 'FRAMEWORK',
    guide: 'PROCEDURAL',
    toolkit: 'TOOLKIT',
  };

  return (
    <Link href={`/resources/${slug}`} className="group block">
      <div className="relative flex h-full flex-col overflow-hidden border border-white/5 bg-zinc-950 transition-all duration-500 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/5">
        
        {/* Featured Badge — Tactical Aesthetic */}
        {isFeatured && (
          <div className="absolute top-0 right-0 z-20">
            <div className="bg-amber-500 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-black">
              Featured Asset
            </div>
          </div>
        )}
        
        {/* Visual Header */}
        <div className="relative h-44 w-full overflow-hidden border-b border-white/5 bg-zinc-900">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover opacity-50 transition-all duration-700 grayscale group-hover:scale-110 group-hover:opacity-80 group-hover:grayscale-0"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          
          <div className="absolute bottom-4 left-4">
            <span className="border border-amber-500/30 bg-black/80 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-tighter text-amber-500 backdrop-blur-md">
              {typeLabels[type]}
            </span>
          </div>
        </div>
        
        {/* Content Body */}
        <div className="flex flex-1 flex-col p-6">
          <h3 className="mb-3 font-serif text-xl italic text-white transition-colors group-hover:text-amber-500">
            {title}
          </h3>
          
          <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {description}
          </p>
          
          {/* Tags — Institutional Style */}
          {tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {safeSlice(tags, 0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500 border border-white/5"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="px-2 py-0.5 font-mono text-[9px] text-zinc-600">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}
          
          {/* Footer Metrics */}
          <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center font-mono text-[10px] text-zinc-500">
              <Download className="mr-2 h-3 w-3 text-amber-500/50" />
              <span>{downloadCount.toLocaleString()} DISTRIBUTIONS</span>
            </div>
            
            <div className="flex items-center font-mono text-[10px] font-bold tracking-widest text-amber-500 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1">
              RETRIEVE <ArrowRight className="ml-2 h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResourceCard;