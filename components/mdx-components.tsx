import * as React from "react";
import * as Lucide from "lucide-react";
import Image from "next/image";

/**
 * MDX COMPONENTS ENGINE
 * - Proxy-based fallback to prevent client-side crashes on unknown tags.
 * - Optimized for deep, structural reading (Kingdom Vault standards).
 * - No dynamic imports to ensure build-time stability.
 */

type AnyProps = Record<string, any>;

const createMissingComponent = (componentName: string): React.FC<AnyProps> => {
  return function MissingComponentWrapper({ children, ...props }) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Vault Warning] MDX component "${componentName}" is undefined. Using fallback.`);
    }

    // Context-aware safety fallbacks
    switch (componentName.toLowerCase()) {
      case "grid":
        return <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10" {...props}>{children}</div>;
      case "quote":
        return <blockquote className="my-10 border-l-2 border-gold pl-8 py-2 italic text-gray-400" {...props}>{children}</blockquote>;
      case "callout":
      case "note":
        return (
          <div className="my-8 rounded-2xl border border-gold/20 bg-gold/5 p-6 shadow-sm" {...props}>
            <div className="flex items-start gap-4">
              <Lucide.Info size={18} className="mt-1 text-gold flex-shrink-0" />
              <div className="flex-1 text-sm leading-relaxed text-gray-300">{children}</div>
            </div>
          </div>
        );
      default:
        return (
          <div className="my-6 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4" {...props}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-2">Missing Tag: {componentName}</p>
            <div className="text-sm text-gray-400">{children}</div>
          </div>
        );
    }
  };
};

// --- Standard HTML Elements ---

export type MdxComponentProps = React.PropsWithChildren<
  Omit<React.HTMLAttributes<HTMLElement>, "title"> & { className?: string }
>;

const H1 = ({ children, ...rest }: MdxComponentProps) => (
  <h1 className="mt-16 mb-8 font-serif text-4xl font-semibold tracking-tight text-white lg:text-5xl" {...rest}>{children}</h1>
);

const H2 = ({ children, ...rest }: MdxComponentProps) => (
  <h2 className="mt-12 mb-6 font-serif text-2xl font-semibold tracking-tight text-white border-b border-white/5 pb-2" {...rest}>{children}</h2>
);

const H3 = ({ children, ...rest }: MdxComponentProps) => (
  <h3 className="mt-10 mb-4 font-serif text-xl font-semibold text-cream" {...rest}>{children}</h3>
);

const P = ({ children, className = "", ...rest }: MdxComponentProps) => (
  <p className={`my-6 text-base sm:text-lg leading-relaxed text-gray-300 ${className}`.trim()} {...rest}>{children}</p>
);

const Ul = ({ children, ...rest }: MdxComponentProps) => (
  <ul className="my-6 ml-6 list-none space-y-3" {...rest}>
    {React.Children.map(children, (child) => (
      <li className="relative pl-6 text-gray-300 leading-relaxed before:absolute before:left-0 before:top-3 before:h-1 before:w-1 before:rounded-full before:bg-gold/60">
        {child}
      </li>
    ))}
  </ul>
);

const Ol = ({ children, ...rest }: MdxComponentProps) => (
  <ol className="my-6 ml-6 list-decimal space-y-3 font-mono text-sm text-gold/80" {...rest}>
    {React.Children.map(children, (child) => (
      <li className="pl-4 leading-relaxed text-gray-300 font-sans text-base">{child}</li>
    ))}
  </ol>
);

const Blockquote = ({ children, ...rest }: MdxComponentProps) => (
  <blockquote className="my-12 relative border-l border-gold/40 bg-zinc-950/50 px-8 py-6 text-lg italic leading-relaxed text-cream rounded-r-3xl" {...rest}>
    <Lucide.Quote size={32} className="absolute -top-4 -right-4 text-gold/10 rotate-12" />
    {children}
  </blockquote>
);

const Code = ({ children, ...rest }: MdxComponentProps) => (
  <code className="rounded-md bg-zinc-900 border border-white/5 px-1.5 py-0.5 text-[0.85em] font-mono text-gold/90" {...rest}>{children}</code>
);

const Pre = ({ children, ...rest }: MdxComponentProps) => (
  <pre className="my-8 overflow-x-auto rounded-2xl border border-white/5 bg-zinc-950 p-6 text-sm leading-relaxed shadow-2xl" {...rest}>{children}</pre>
);

const A = ({ children, ...rest }: MdxComponentProps) => (
  <a className="font-medium text-gold decoration-gold/30 underline underline-offset-4 hover:text-white hover:decoration-white transition-all" {...rest}>{children}</a>
);

// --- Strategic Assets ---

const MdxImage = ({ src, alt, ...rest }: any) => {
  if (!src) return null;
  return (
    <figure className="my-12">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt || ""} className="block h-auto w-full object-cover transition-transform duration-700 hover:scale-[1.02]" {...rest} />
      </div>
      {alt && <figcaption className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">{alt}</figcaption>}
    </figure>
  );
};

const iconMap = Lucide as unknown as Record<string, React.FC<any>>;
const Icon = ({ name, className = "", size = 20, ...props }: { name: string; className?: string; size?: number } & AnyProps) => {
  const Cmp = iconMap[name];
  if (!Cmp) return null;
  return <Cmp className={`inline-block text-gold ${className}`} size={size} {...props} />;
};

// --- Component Registry ---

const baseComponents: Record<string, any> = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  ul: Ul,
  ol: Ol,
  blockquote: Blockquote,
  code: Code,
  pre: Pre,
  a: A,
  img: MdxImage,
  Icon,
};

const components = new Proxy(baseComponents, {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    // This allows for case-insensitive matching or generic fallbacks
    return createMissingComponent(prop);
  },
});

export default components;
export { components as mdxComponents };