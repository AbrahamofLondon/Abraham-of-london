// lib/mdx/safe-components.ts — BUILD-PROOF MDX COMPONENT RESOLVER
import * as React from "react";
import { Rule } from "@/components/mdx/Rule";
import { BriefingHeader } from "@/components/mdx/BriefingHeader"; // Added Import
import { DataGrid } from "@/components/mdx/DataGrid";             // Added Import

export type MDXComponentMap = Record<string, React.ComponentType<any>>;

export type SafeMdxOptions = {
  warnOnFallback?: boolean;
  seeded?: MDXComponentMap;
};

const RESERVED_WORDS = new Set([
  'Object', 'Array', 'Function', 'String', 'Number', 'Boolean', 'Symbol',
  'Promise', 'Error', 'Date', 'Math', 'JSON', 'console', 'window', 'document',
  'undefined', 'null', 'NaN', 'Infinity', 'global', 'process', 'module',
  'exports', 'require', 'arguments', 'eval', 'this', 'super', 'new', 'typeof',
  'instanceof', 'delete', 'in', 'with', 'void', 'await', 'async', 'yield',
  'let', 'const', 'var', 'class', 'extends', 'import', 'export', 'default',
  'return', 'throw', 'try', 'catch', 'finally', 'if', 'else', 'switch',
  'case', 'break', 'continue', 'for', 'while', 'do', 'true', 'false'
]);

function isComponent(x: any): x is React.ComponentType<any> {
  return typeof x === "function" || (x && typeof x === "object" && x.$$typeof);
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * SOVEREIGN FALLBACK
 * Renders a technical diagnostic box in Dev, or silent fragment in Production.
 */
function createMissingComponent(name: string, warnOnFallback: boolean): React.ComponentType<any> {
  const isDev = process.env.NODE_ENV !== "production";

  const Missing: React.ComponentType<any> = (props: any) => {
    const { children, className, ...rest } = props || {};

    if (warnOnFallback && isDev) {
      console.warn(`[MDX Safe] Missing component "${name}" — rendered diagnostic fallback.`);
    }

    if (isDev) {
      return React.createElement(
        "div",
        {
          "data-missing-component": name,
          className: cx("my-8 rounded-xl border border-amber-500/30 bg-black p-6 font-mono", className),
          ...rest,
        },
        React.createElement("div", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-amber-500" }, "UNRESOLVED_INTEL_COMPONENT"),
        React.createElement("div", { className: "mt-2 text-sm text-zinc-400" }, `Component: <${name} />`),
        children ? React.createElement("div", { className: "mt-4 rounded border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-500" }, children) : null
      );
    }

    return children ? React.createElement(React.Fragment, null, children) : null;
  };

  Missing.displayName = `Missing(${name})`;
  return Missing;
}

/**
 * SOVEREIGN SEEDED DEFAULTS
 * Standardizing the look of the 75 Intelligence Briefs.
 */
function seededDefaults(): MDXComponentMap {
  const BrandFrame: React.ComponentType<any> = (props: any) =>
    React.createElement("section", { 
      className: cx("my-12 rounded-3xl border border-zinc-200 bg-zinc-50/50 p-8 md:p-12 shadow-sm", props?.className) 
    }, props?.children);

  const Note: React.ComponentType<any> = (props: any) =>
    React.createElement("div", { 
      className: cx("my-8 rounded-2xl border-l-4 border-amber-500 bg-amber-50/30 p-6 text-zinc-800 shadow-sm", props?.className) 
    }, 
    React.createElement("span", { className: "block text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2" }, "Internal Note"),
    props?.children
    );

  return { 
    BrandFrame, 
    hr: Rule, 
    Rule, 
    Note, // Fixed: Added missing comma
    BriefingHeader, // Fixed: Now has import
    DataGrid,       // Fixed: Now has import
  };
}

export function createProxySafeMdxComponents(base: unknown, options: SafeMdxOptions = {}): MDXComponentMap {
  const warnOnFallback = options.warnOnFallback ?? true;
  const baseMap: MDXComponentMap = base && typeof base === "object" ? (base as MDXComponentMap) : {};
  const seeded = { ...seededDefaults(), ...(options.seeded || {}), ...baseMap };
  const cache = new Map<string, React.ComponentType<any>>();

  return new Proxy(seeded, {
    get(target, prop: string | symbol) {
      const key = String(prop);
      if (key === "then" || key === "__esModule" || key === "displayName") return (target as any)[key];
      
      const existing = (target as any)[key];
      if (isComponent(existing)) return existing;
      
      if (!cache.has(key)) {
        cache.set(key, createMissingComponent(key, warnOnFallback));
      }
      return cache.get(key);
    },
  }) as unknown as MDXComponentMap;
}

export function detectMdxComponentNames(mdxRaw: string): string[] {
  const mdx = String(mdxRaw || "");
  const names = new Set<string>();
  const tagRe = /<\/?\s*([A-Z][A-Za-z0-9_]*)\b/g;
  let m: RegExpExecArray | null;
  
  while ((m = tagRe.exec(mdx))) {
    const name = m[1];
    if (name && !RESERVED_WORDS.has(name)) {
      names.add(name);
    }
  }
  return Array.from(names);
}

export function seedMissingMdxComponents(base: unknown, mdxRaw: string, options: SafeMdxOptions = {}): MDXComponentMap {
  const warnOnFallback = options.warnOnFallback ?? true;
  const baseMap: MDXComponentMap = base && typeof base === "object" ? (base as MDXComponentMap) : {};
  const seeded = { ...baseMap, ...(options.seeded || {}) } as MDXComponentMap;
  const names = detectMdxComponentNames(mdxRaw);

  for (const name of names) {
    if (!seeded[name] && !RESERVED_WORDS.has(name)) {
      seeded[name] = createMissingComponent(name, warnOnFallback);
    }
  }
  return seeded;
}

export function createSeededSafeMdxComponents(base: unknown, mdxRaw: string, options: SafeMdxOptions = {}): MDXComponentMap {
  const seeded = seedMissingMdxComponents(base, mdxRaw, options);
  return createProxySafeMdxComponents(seeded, options);
}