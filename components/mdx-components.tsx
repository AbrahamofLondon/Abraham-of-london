// components/mdx-components.tsx
import * as React from "react";

// Create a simple fallback component for any missing MDX component
const createMissingComponent = (componentName: string): React.FC<any> => {
  return function MissingComponentWrapper({ children, ...props }) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`MDX component "${componentName}" is not defined. Using fallback.`);
    }

    // Special cases for common components
    switch (componentName.toLowerCase()) {
      case 'grid':
        return (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6"
            {...props}
          >
            {children}
          </div>
        );
      
      case 'quote':
        return (
          <blockquote 
            className="my-8 border-l-4 border-gold pl-6 py-4 italic text-gray-300"
            {...props}
          >
            {children}
          </blockquote>
        );
      
      case 'callout':
      case 'note':
        return (
          <div 
            className="my-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5"
            {...props}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20">
                <span className="text-xs font-bold text-amber-400">!</span>
              </div>
              <div className="flex-1 text-amber-300/90">
                {children}
              </div>
            </div>
          </div>
        );
      
      case 'badge':
        return (
          <span 
            className="inline-block rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300"
            {...props}
          >
            {children}
          </span>
        );
      
      case 'caption':
        return (
          <figcaption 
            className="mt-2 text-center text-sm text-gray-500"
            {...props}
          >
            {children}
          </figcaption>
        );
      
      default:
        // Generic fallback
        return (
          <div 
            className="my-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4"
            {...props}
          >
            <p className="text-sm font-medium text-red-400 mb-2">
              Component <code className="rounded bg-red-500/10 px-2 py-1">{componentName}</code>
            </p>
            {children && (
              <div className="text-gray-300">
                {children}
              </div>
            )}
          </div>
        );
    }
  };
};

// Try to import components with fallbacks
const tryImport = <T,>(path: string, componentName: string): T | null => {
  try {
    // @ts-ignore - Dynamic import
    const module = require(path);
    return module.default || module;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Could not import ${componentName} from ${path}`);
    }
    return null;
  }
};

// Import MDX components with fallbacks
const Badge = tryImport<any>("@/components/mdx/Badge", "Badge");
const BadgeRow = tryImport<any>("@/components/mdx/BadgeRow", "BadgeRow");
const Callout = tryImport<any>("@/components/mdx/Callout", "Callout");
const Caption = tryImport<any>("@/components/mdx/Caption", "Caption");
const DownloadCard = tryImport<any>("@/components/mdx/DownloadCard", "DownloadCard");
const HeroEyebrow = tryImport<any>("@/components/mdx/HeroEyebrow", "HeroEyebrow");
const JsonLd = tryImport<any>("@/components/mdx/JsonLd", "JsonLd");
const Note = tryImport<any>("@/components/mdx/Note", "Note");
const PullLine = tryImport<any>("@/components/mdx/PullLine", "PullLine");
const ResourcesCTA = tryImport<any>("@/components/mdx/ResourcesCTA", "ResourcesCTA");
const Rule = tryImport<any>("@/components/mdx/Rule", "Rule");
const ShareRow = tryImport<any>("@/components/mdx/ShareRow", "ShareRow");
const Verse = tryImport<any>("@/components/mdx/Verse", "Verse");
const Grid = tryImport<any>("@/components/mdx/Grid", "Grid");
const Quote = tryImport<any>("@/components/mdx/Quote", "Quote");

// Print components
const BrandFrame = tryImport<any>("@/components/print/BrandFrame", "BrandFrame");
const EmbossedBrandMark = tryImport<any>("@/components/print/EmbossedBrandMark", "EmbossedBrandMark");
const EmbossedSign = tryImport<any>("@/components/print/EmbossedSign", "EmbossedSign");

// Site-specific helpers
const GlossaryTerm = tryImport<any>("@/components/GlossaryTerm", "GlossaryTerm");
const CanonReference = tryImport<any>("@/components/CanonReference", "CanonReference");

// Helper to get component or create fallback
const getComponent = (Component: any, componentName: string): React.FC<any> => {
  if (Component) return Component;
  return createMissingComponent(componentName);
};

// HTML Elements
export type MdxComponentProps = React.PropsWithChildren<
  Omit<React.HTMLAttributes<HTMLElement>, "title"> & { className?: string }
>;

const H1 = ({ children, ...rest }: MdxComponentProps) => (
  <h1
    className="mt-10 mb-6 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-gray-50"
    {...rest}
  >
    {children}
  </h1>
);

const H2 = ({ children, ...rest }: MdxComponentProps) => (
  <h2
    className="mt-8 mb-4 font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-gray-50"
    {...rest}
  >
    {children}
  </h2>
);

const H3 = ({ children, ...rest }: MdxComponentProps) => (
  <h3
    className="mt-7 mb-3 font-serif text-xl sm:text-2xl font-semibold text-gray-50"
    {...rest}
  >
    {children}
  </h3>
);

const H4 = ({ children, ...rest }: MdxComponentProps) => (
  <h4 className="mt-6 mb-3 text-base font-semibold text-gray-100" {...rest}>
    {children}
  </h4>
);

const P = ({ children, className = "", ...rest }: MdxComponentProps) => (
  <p
    className={`my-5 text-[1.02rem] sm:text-[1.06rem] leading-[1.9] text-gray-100 ${className}`.trim()}
    {...rest}
  >
    {children}
  </p>
);

const Strong = ({ children, ...rest }: MdxComponentProps) => (
  <strong className="font-semibold text-gray-50" {...rest}>
    {children}
  </strong>
);

const Em = ({ children, ...rest }: MdxComponentProps) => (
  <em className="italic text-gray-200" {...rest}>
    {children}
  </em>
);

const Ul = ({ children, ...rest }: MdxComponentProps) => (
  <ul
    className="my-5 ml-6 list-disc space-y-2 text-[1.02rem] leading-relaxed text-gray-100"
    {...rest}
  >
    {children}
  </ul>
);

const Ol = ({ children, ...rest }: MdxComponentProps) => (
  <ol
    className="my-5 ml-6 list-decimal space-y-2 text-[1.02rem] leading-relaxed text-gray-100"
    {...rest}
  >
    {children}
  </ol>
);

const Li = ({ children, ...rest }: MdxComponentProps) => (
  <li className="leading-relaxed text-gray-100" {...rest}>
    {children}
  </li>
);

const Blockquote = ({ children, ...rest }: MdxComponentProps) => (
  <blockquote
    className="my-8 border-l-4 border-softGold/70 bg-white/5 px-5 py-4 text-[1rem] leading-relaxed italic text-gray-100 rounded-r-2xl"
    {...rest}
  >
    {children}
  </blockquote>
);

const Code = ({ children, ...rest }: MdxComponentProps) => (
  <code
    className="rounded bg-slate-900 px-1.5 py-0.5 text-[0.8rem] font-mono text-amber-200"
    {...rest}
  >
    {children}
  </code>
);

const Pre = ({ children, ...rest }: MdxComponentProps) => (
  <pre
    className="my-6 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4 text-[0.85rem] text-slate-100"
    {...rest}
  >
    {children}
  </pre>
);

const A = ({ children, ...rest }: MdxComponentProps) => (
  <a
    className="font-medium text-softGold underline-offset-2 hover:text-amber-200 hover:underline"
    {...rest}
  >
    {children}
  </a>
);

interface ImageProps extends MdxComponentProps {
  src?: string;
  alt?: string;
}
const MdxImage = ({ src, alt, className = "", ...rest }: ImageProps) => {
  if (!src) return null;
  return (
    <figure className="my-8 flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={String(src)}
        alt={alt ? String(alt) : ""}
        className={(
          "block h-auto w-auto max-w-full " +
          "max-h-[420px] sm:max-h-[460px] md:max-h-[500px] " +
          "rounded-2xl border border-slate-800/70 bg-slate-900/60 " +
          "object-contain shadow-soft-elevated " +
          className
        ).trim()}
        {...rest}
      />
    </figure>
  );
};

// Create a proxy to handle any component dynamically
const createComponentsProxy = () => {
  const baseComponents = {
    // HTML Elements
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    p: P,
    strong: Strong,
    em: Em,
    ul: Ul,
    ol: Ol,
    li: Li,
    blockquote: Blockquote,
    code: Code,
    pre: Pre,
    a: A,
    img: MdxImage,

    // Your MDX blocks
    HeroEyebrow: getComponent(HeroEyebrow, "HeroEyebrow"),
    Caption: getComponent(Caption, "Caption"),
    Callout: getComponent(Callout, "Callout"),
    Note: getComponent(Note, "Note"),
    Rule: getComponent(Rule, "Rule"),
    Divider: getComponent(Rule, "Rule"), // Alias
    PullLine: getComponent(PullLine, "PullLine"),
    Badge: getComponent(Badge, "Badge"),
    BadgeRow: getComponent(BadgeRow, "BadgeRow"),
    DownloadCard: getComponent(DownloadCard, "DownloadCard"),
    ResourcesCTA: getComponent(ResourcesCTA, "ResourcesCTA"),
    ShareRow: getComponent(ShareRow, "ShareRow"),
    Verse: getComponent(Verse, "Verse"),
    JsonLd: getComponent(JsonLd, "JsonLd"),
    
    // New components
    Grid: getComponent(Grid, "Grid"),
    Quote: getComponent(Quote, "Quote"),

    // Print blocks
    BrandFrame: getComponent(BrandFrame, "BrandFrame"),
    EmbossedBrandMark: getComponent(EmbossedBrandMark, "EmbossedBrandMark"),
    EmbossedSign: getComponent(EmbossedSign, "EmbossedSign"),

    // Extra helpers
    GlossaryTerm: getComponent(GlossaryTerm, "GlossaryTerm"),
    CanonReference: getComponent(CanonReference, "CanonReference"),
  };

  return new Proxy(baseComponents, {
    get(target, prop: string) {
      // If component exists in our object, return it
      if (prop in target) {
        return target[prop as keyof typeof target];
      }
      
      // Otherwise, create a fallback component
      return createMissingComponent(prop);
    },
  });
};

// Create the components proxy
const components = createComponentsProxy();

export default components;
export { components as mdxComponents };