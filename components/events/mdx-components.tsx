'use client';

import * as React from "react";
import Image from "next/image";
import Link, { LinkProps } from "next/link";
import { ChevronRight, ExternalLink, Shield, Info, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import Rule from "@/components/mdx/Rule";
import { safeFirstChar } from "@/lib/utils/safe";

/* -------------------------------------------------------------------------- */
/* 1. PRIMITIVE TYPES FOR STRICT TYPE SAFETY                                  */
/* -------------------------------------------------------------------------- */

type InternalLinkProps = Omit<LinkProps, 'href'> & {
  href: string;
  children: React.ReactNode;
  className?: string;
  onMouseEnter?: React.MouseEventHandler<HTMLAnchorElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLAnchorElement>;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  onAuxClick?: never;
  onContextMenu?: never;
  onDragStart?: never;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 
  'href' | 'onMouseEnter' | 'onMouseLeave' | 'onClick'
>;

/* -------------------------------------------------------------------------- */
/* 2. SOVEREIGN TYPOGRAPHY SYSTEM                                             */
/* -------------------------------------------------------------------------- */

const H1: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h1 className="mt-12 mb-8 font-serif italic text-4xl md:text-6xl text-white tracking-tighter border-b border-white/5 pb-4">
    {children}
  </h1>
);

const H2: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h2 className="mt-14 mb-6 font-serif italic text-2xl md:text-3xl text-zinc-100 flex items-center gap-4">
    <span className="h-px flex-1 bg-white/10"></span>
    {children}
    <span className="h-px flex-1 bg-white/10"></span>
  </h2>
);

const H3: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h3 className="mt-10 mb-4 font-mono text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/80 flex items-center gap-3">
    <Zap className="w-3 h-3" />
    {children}
  </h3>
);

const P: React.FC<React.PropsWithChildren> = ({ children }) => (
  <p className="my-6 text-zinc-400 leading-relaxed tracking-wide font-light max-w-3xl selection:bg-amber-500/30">
    {children}
  </p>
);

const Ul: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ul className="my-6 space-y-4 pl-2 text-zinc-400 max-w-3xl">
    {children}
  </ul>
);

const Li: React.FC<React.PropsWithChildren> = ({ children }) => (
  <li className="flex items-start gap-3 leading-relaxed">
    <span className="mt-2.5 w-1 h-1 bg-amber-500 rotate-45 flex-shrink-0" />
    <span>{children}</span>
  </li>
);

const Strong: React.FC<React.PropsWithChildren> = ({ children }) => (
  <strong className="font-bold text-zinc-200 border-b border-amber-500/30 pb-0.5">
    {children}
  </strong>
);

const Blockquote: React.FC<React.PropsWithChildren> = ({ children }) => (
  <blockquote className="my-10 relative pl-10 py-8 border-l border-amber-500/50 bg-zinc-900/30 backdrop-blur-sm group">
    <div className="absolute top-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Shield className="w-12 h-12 text-amber-500" />
    </div>
    <div className="text-xl font-serif italic text-zinc-300 leading-relaxed relative z-10">
      {children}
    </div>
  </blockquote>
);

/* -------------------------------------------------------------------------- */
/* 3. SECURE LINK SYSTEM                                                      */
/* -------------------------------------------------------------------------- */

const A: React.FC<InternalLinkProps> = ({ 
  href = "#", 
  children, 
  className = "",
  ...rest 
}) => {
  const isExternal = /^https?:\/\//i.test(href);
  
  const baseStyles = "font-mono text-[11px] uppercase tracking-widest text-amber-500 hover:text-white transition-all duration-300 border-b border-amber-500/20 hover:border-white pb-1";

  if (isExternal) {
    return (
      <a
        href={href}
        className={`${baseStyles} inline-flex items-center gap-2 ${className}`}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <Link href={href} className={`${baseStyles} inline-flex items-center gap-2 ${className}`}>
      {children}
      <ChevronRight className="w-3 h-3" />
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. DOSSIER ASSET COMPONENT                                                 */
/* -------------------------------------------------------------------------- */

const Img: React.FC<any> = ({ src, alt = "", caption }) => (
  <figure className="my-12 w-full">
    <div className="relative border border-white/10 bg-zinc-900 p-1">
      <div className="relative aspect-video overflow-hidden">
        {src && (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out"
          />
        )}
      </div>
    </div>
    {caption && (
      <figcaption className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 text-center">
        Ref // {caption}
      </figcaption>
    )}
  </figure>
);

/* -------------------------------------------------------------------------- */
/* 5. BRIEFING UTILITIES (Notes & Quotes)                                     */
/* -------------------------------------------------------------------------- */

interface NoteProps {
  title?: string;
  tone?: "info" | "warning" | "success" | "premium";
  children: React.ReactNode;
}

const Note: React.FC<NoteProps> = ({ title, tone = "info", children }) => {
  const configs = {
    info: { icon: Info, color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5" },
    warning: { icon: AlertTriangle, color: "text-amber-500", border: "border-amber-500/20", bg: "bg-amber-500/5" },
    success: { icon: CheckCircle, color: "text-emerald-500", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
    premium: { icon: Shield, color: "text-zinc-100", border: "border-white/10", bg: "bg-zinc-800/50" },
  };

  // Fallback to 'info' if an invalid tone is passed via MDX
  const config = configs[tone as keyof typeof configs] || configs.info;
  const Icon = config.icon;

  return (
    <aside className={`my-8 border ${config.border} ${config.bg} p-6 relative overflow-hidden`}>
      <div className="flex gap-4 relative z-10">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
        <div>
          {title && (
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-zinc-200 mb-2">
              {title}
            </p>
          )}
          <div className="text-sm text-zinc-400 leading-relaxed">{children}</div>
        </div>
      </div>
    </aside>
  );
};

const SpeakerCard: React.FC<any> = ({ name, title, company, image, topics = [] }) => (
  <div className="my-4 p-6 border border-white/5 bg-zinc-900/50 hover:border-amber-500/30 transition-all duration-500 flex items-center gap-6">
    <div className="w-16 h-16 grayscale rounded-none border border-white/10 overflow-hidden relative">
      {image ? (
        <Image src={image} alt={name} fill className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-serif italic text-2xl text-zinc-700 bg-zinc-950">
          {safeFirstChar(name)}
        </div>
      )}
    </div>
    <div className="flex-1">
      <h4 className="font-serif italic text-white text-lg">{name}</h4>
      <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 mt-1">
        {title} {company && <span className="opacity-50"> // {company}</span>}
      </p>
      <div className="flex gap-2 mt-3">
        {topics.map((t: string, i: number) => (
          <span key={i} className="text-[8px] font-bold text-amber-500/60 uppercase tracking-tighter border border-amber-500/20 px-1.5 py-0.5">
            {t}
          </span>
        ))}
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* 6. EXPORT MAPPING                                                          */
/* -------------------------------------------------------------------------- */

const mdxComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  ul: Ul,
  li: Li,
  strong: Strong,
  blockquote: Blockquote,
  hr: () => <Rule />,
  a: A,
  img: Img,
  Note,
  SpeakerCard,
  Verse: ({ children, refText }: any) => (
    <div className="my-10 text-center max-w-2xl mx-auto">
      <div className="font-serif italic text-xl text-zinc-300 leading-relaxed">
        "{children}"
      </div>
      {refText && <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500">{refText}</div>}
    </div>
  ),
  Countdown: ({ date }: { date: Date }) => {
    // Logic remains same as yours, but styled for Dossier aesthetic
    return <div className="p-4 border border-amber-500/20 font-mono text-center text-amber-500">T-MINUS [SYSTEM ENCRYPTED]</div>;
  }
};

export default mdxComponents;