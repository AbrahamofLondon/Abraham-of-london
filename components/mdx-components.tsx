/* eslint-disable @typescript-eslint/no-explicit-any */
// components/mdx-components.tsx — BULLETPROOF PRODUCTION STABLE
import * as React from "react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { HelpCircle, ArrowUpRight, Info } from "lucide-react";

type AnyProps = Record<string, any>;
const isDev = process.env.NODE_ENV === "development";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* -----------------------------------------------------------------------------
  MISSING COMPONENT BOUNDARY
----------------------------------------------------------------------------- */
const MissingComponent: ComponentType<{ name: string; children?: ReactNode }> = ({ name, children, ...rest }) => {
  if (isDev) {
    return (
      <div className="my-6 rounded-xl border-2 border-dashed border-amber-500/20 bg-amber-500/5 p-6" {...rest}>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-500">
          <HelpCircle className="h-4 w-4" /> Component Missing: {name}
        </div>
        {children && <div className="mt-4 opacity-50">{children}</div>}
      </div>
    );
  }
  return children ? <>{children}</> : null;
};

/* -----------------------------------------------------------------------------
  INSTITUTIONAL HTML TAG OVERRIDES
----------------------------------------------------------------------------- */
const A: ComponentType<any> = (props: AnyProps) => {
  const href = String(props?.href || "");
  const isInternal = href.startsWith("/") || href.startsWith("#");
  const styles = "text-amber-500 underline underline-offset-4 decoration-amber-500/30 hover:decoration-amber-500 transition-all";

  if (isInternal) {
    return <Link href={href} className={cx(styles, props.className)}>{props.children}</Link>;
  }
  return (
    <a {...props} href={href} target="_blank" rel="noopener noreferrer" className={cx(styles, "inline-flex items-center gap-1", props.className)}>
      {props.children} <ArrowUpRight className="h-3 w-3 opacity-50" />
    </a>
  );
};

const H1: ComponentType<any> = (props: AnyProps) => (
  <h1 {...props} className={cx("font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-8 mt-16 tracking-tight", props?.className)} />
);

const H2: ComponentType<any> = (props: AnyProps) => (
  <h2 {...props} id={props.id} className={cx("font-serif text-2xl md:text-3xl text-white/90 mb-6 mt-12 tracking-tight border-b border-white/5 pb-2", props?.className)} />
);

const H3: ComponentType<any> = (props: AnyProps) => (
  <h3 {...props} id={props.id} className={cx("font-serif text-xl md:text-2xl text-white/80 mb-4 mt-8 tracking-tight", props?.className)} />
);

const P: ComponentType<any> = (props: AnyProps) => (
  <p {...props} className={cx("font-sans text-lg leading-relaxed text-white/70 my-6 font-light", props?.className)} />
);

const Blockquote: ComponentType<any> = (props: AnyProps) => (
  <blockquote {...props} className={cx("my-12 border-l-2 border-amber-500/50 bg-white/[0.03] py-8 px-8 rounded-r-2xl font-serif italic text-xl text-white/90 leading-snug", props?.className)} />
);

const Ul: ComponentType<any> = (props: AnyProps) => (
  <ul {...props} className={cx("list-none space-y-4 my-8 ml-2", props?.className)} />
);

const Li: ComponentType<any> = (props: AnyProps) => (
  <li className="flex gap-4 font-sans text-white/70">
    <span className="text-amber-500/50 font-mono text-xs mt-1.5">/</span>
    <span className="text-lg leading-relaxed font-light">{props.children}</span>
  </li>
);

/* -----------------------------------------------------------------------------
  INTEL BRIEF HANDLERS (The "Firebreak" Handlers)
----------------------------------------------------------------------------- */

/** 🛡️ THE FIX: Prevents React from trying to render the JSON object as a child */
const JsonLd = ({ data }: { data: any }) => {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

const Rule = () => <hr className="my-16 border-t border-white/10" />;

const HeroEyebrow = ({ children }: { children: ReactNode }) => (
  <div className="text-amber-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-4">
    {children}
  </div>
);

const PullLine = ({ children, subtle }: { children: ReactNode; subtle?: boolean }) => (
  <div className={cx(
    "my-12 py-6 px-8 border-l-2 border-amber-500/20 text-xl md:text-2xl font-serif italic",
    subtle ? "text-white/40" : "text-white/90"
  )}>
    {children}
  </div>
);

const Verse = ({ children, cite }: { children: ReactNode; cite?: string }) => (
  <div className="my-10 text-center max-w-xl mx-auto">
    <div className="text-2xl font-serif text-cream italic leading-relaxed mb-4">
      {children}
    </div>
    {cite && <div className="text-xs font-mono uppercase tracking-widest text-amber-500/60">— {cite}</div>}
  </div>
);

const Note = ({ children, title, tone }: { children: ReactNode; title?: string; tone?: string }) => (
  <div className={cx(
    "my-8 p-6 rounded-xl border border-white/5",
    tone === "key" ? "bg-amber-500/5" : "bg-white/[0.02]"
  )}>
    {title && <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-500 mb-4"><Info className="h-4 w-4" /> {title}</div>}
    <div className="text-white/70 font-light leading-relaxed">{children}</div>
  </div>
);

const Caption = ({ children }: { children: ReactNode }) => (
  <div className="mt-4 text-center text-xs font-sans text-white/30 italic tracking-wide">
    {children}
  </div>
);

/* -----------------------------------------------------------------------------
  REGISTRY EXPORT
----------------------------------------------------------------------------- */
const mdxComponents: Record<string, ComponentType<any>> = {
  a: A,
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  blockquote: Blockquote,
  ul: Ul,
  li: Li,
  hr: Rule,
  code: (props: any) => <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-amber-200" {...props} />,
  
  // Intelligence Brief Custom Tags
  JsonLd,
  Rule,
  HeroEyebrow,
  PullLine,
  Verse,
  Note,
  Caption,
  
  // Infrastructure Placeholders
  BrandFrame: (props: any) => <MissingComponent name="BrandFrame" {...props} />,
  ResourcesCTA: (props: any) => <MissingComponent name="ResourcesCTA" {...props} />,
  ShareRow: (props: any) => <MissingComponent name="ShareRow" {...props} />,
  FeatureCard: (props: any) => <MissingComponent name="FeatureCard" {...props} />,
  DownloadCard: (props: any) => <MissingComponent name="DownloadCard" {...props} />,
};

export default mdxComponents;