import * as React from "react";
import * as Lucide from "lucide-react";

/**
 * IMPORTANT:
 * - No dynamic require()
 * - No runtime import()
 * - Unknown MDX components render a safe fallback instead of crashing the client.
 */

type AnyProps = Record<string, any>;

const createMissingComponent = (componentName: string): React.FC<AnyProps> => {
  return function MissingComponentWrapper({ children, ...props }) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(`MDX component "${componentName}" is not defined. Using fallback.`);
    }

    // Lightweight special-cases (safe + useful)
    switch (componentName.toLowerCase()) {
      case "grid":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6" {...props}>
            {children}
          </div>
        );

      case "quote":
        return (
          <blockquote className="my-8 border-l-4 border-gold pl-6 py-4 italic text-gray-300" {...props}>
            {children}
          </blockquote>
        );

      case "callout":
      case "note":
        return (
          <div className="my-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5" {...props}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20">
                <span className="text-xs font-bold text-amber-400">!</span>
              </div>
              <div className="flex-1 text-amber-300/90">{children}</div>
            </div>
          </div>
        );

      default:
        return (
          <div className="my-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4" {...props}>
            <p className="text-sm font-medium text-red-400 mb-2">
              Component{" "}
              <code className="rounded bg-red-500/10 px-2 py-1">{componentName}</code>
            </p>
            {children ? <div className="text-gray-300">{children}</div> : null}
          </div>
        );
    }
  };
};

// HTML Elements
export type MdxComponentProps = React.PropsWithChildren<
  Omit<React.HTMLAttributes<HTMLElement>, "title"> & { className?: string }
>;

const H1 = ({ children, ...rest }: MdxComponentProps) => (
  <h1 className="mt-10 mb-6 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-gray-50" {...rest}>
    {children}
  </h1>
);

const H2 = ({ children, ...rest }: MdxComponentProps) => (
  <h2 className="mt-8 mb-4 font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-gray-50" {...rest}>
    {children}
  </h2>
);

const H3 = ({ children, ...rest }: MdxComponentProps) => (
  <h3 className="mt-7 mb-3 font-serif text-xl sm:text-2xl font-semibold text-gray-50" {...rest}>
    {children}
  </h3>
);

const H4 = ({ children, ...rest }: MdxComponentProps) => (
  <h4 className="mt-6 mb-3 text-base font-semibold text-gray-100" {...rest}>
    {children}
  </h4>
);

const P = ({ children, className = "", ...rest }: MdxComponentProps) => (
  <p className={`my-5 text-[1.02rem] sm:text-[1.06rem] leading-[1.9] text-gray-100 ${className}`.trim()} {...rest}>
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
  <ul className="my-5 ml-6 list-disc space-y-2 text-[1.02rem] leading-relaxed text-gray-100" {...rest}>
    {children}
  </ul>
);

const Ol = ({ children, ...rest }: MdxComponentProps) => (
  <ol className="my-5 ml-6 list-decimal space-y-2 text-[1.02rem] leading-relaxed text-gray-100" {...rest}>
    {children}
  </ol>
);

const Li = ({ children, ...rest }: MdxComponentProps) => (
  <li className="leading-relaxed text-gray-100" {...rest}>
    {children}
  </li>
);

const Blockquote = ({ children, ...rest }: MdxComponentProps) => (
  <blockquote className="my-8 border-l-4 border-softGold/70 bg-white/5 px-5 py-4 text-[1rem] leading-relaxed italic text-gray-100 rounded-r-2xl" {...rest}>
    {children}
  </blockquote>
);

const Code = ({ children, ...rest }: MdxComponentProps) => (
  <code className="rounded bg-slate-900 px-1.5 py-0.5 text-[0.8rem] font-mono text-amber-200" {...rest}>
    {children}
  </code>
);

const Pre = ({ children, ...rest }: MdxComponentProps) => (
  <pre className="my-6 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4 text-[0.85rem] text-slate-100" {...rest}>
    {children}
  </pre>
);

const A = ({ children, ...rest }: MdxComponentProps) => (
  <a className="font-medium text-softGold underline-offset-2 hover:text-amber-200 hover:underline" {...rest}>
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

// Optional: safe Icon component (no dynamic imports)
const iconMap = Lucide as unknown as Record<string, React.FC<any>>;
const Icon = ({ name, ...props }: { name: string } & AnyProps) => {
  const Cmp = iconMap[name];
  if (!Cmp) return null;
  return <Cmp {...props} />;
};

// Base components + safe proxy fallback
const baseComponents: Record<string, any> = {
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

  Icon,
};

const components = new Proxy(baseComponents, {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    return createMissingComponent(prop);
  },
});

export default components;
export { components as mdxComponents };