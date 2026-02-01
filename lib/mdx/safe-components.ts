// lib/mdx/safe-components.ts — BUILD-PROOF MDX COMPONENT RESOLVER (TS, NO JSX)
import * as React from "react";

export type MDXComponentMap = Record<string, React.ComponentType<any>>;

export type SafeMdxOptions = {
  warnOnFallback?: boolean;
  seeded?: MDXComponentMap;
};

function isComponent(x: any): x is React.ComponentType<any> {
  return typeof x === "function" || (x && typeof x === "object" && x.$$typeof);
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function createMissingComponent(name: string, warnOnFallback: boolean): React.ComponentType<any> {
  const isDev = process.env.NODE_ENV !== "production";

  const Missing: React.ComponentType<any> = (props: any) => {
    const p = props || {};
    const children = p.children;
    const className = p.className;
    const rest = { ...p };
    delete rest.children;
    delete rest.className;

    if (warnOnFallback && isDev) {
      console.warn(`[MDX Safe] Missing component "${name}" — rendered fallback.`);
    }

    if (isDev) {
      return React.createElement(
        "div",
        {
          "data-missing-component": name,
          className: cx("my-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-100", className),
          ...rest,
        },
        React.createElement("div", { className: "text-xs font-bold uppercase tracking-widest text-red-200" }, "Missing MDX Component"),
        React.createElement("div", { className: "mt-1 font-mono text-sm text-red-100" }, name),
        children ? React.createElement("div", { className: "mt-3 rounded-lg border border-red-500/20 bg-black/20 p-3 text-sm text-red-50" }, children) : null
      );
    }

    return children ? React.createElement(React.Fragment, null, children) : null;
  };

  Missing.displayName = `Missing(${name})`;
  return Missing;
}

function seededDefaults(): MDXComponentMap {
  const BrandFrame: React.ComponentType<any> = (props: any) =>
    React.createElement("section", { className: cx("my-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6", props?.className), ...props }, props?.children);

  const Rule: React.ComponentType<any> = (props: any) =>
    React.createElement("hr", { className: cx("my-10 border-0 h-px bg-white/10", props?.className), ...props });

  const Note: React.ComponentType<any> = (props: any) =>
    React.createElement("div", { className: cx("my-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-100", props?.className), ...props }, props?.children);

  return { BrandFrame, Rule, Note };
}

export function createProxySafeMdxComponents(base: unknown, options: SafeMdxOptions = {}): MDXComponentMap {
  const warnOnFallback = options.warnOnFallback ?? true;
  const baseMap: MDXComponentMap = base && typeof base === "object" ? (base as MDXComponentMap) : {};
  const seeded = { ...seededDefaults(), ...(options.seeded || {}), ...baseMap };
  const cache = new Map<string, React.ComponentType<any>>();

  return new Proxy(seeded, {
    get(target, prop: string | symbol) {
      const key = String(prop);
      if (key === "then" || key === "__esModule") return (target as any)[key];
      const existing = (target as any)[key];
      if (isComponent(existing)) return existing;
      if (cache.has(key)) return cache.get(key);
      const missing = createMissingComponent(key, warnOnFallback);
      cache.set(key, missing);
      return missing;
    },
  }) as unknown as MDXComponentMap;
}

export function detectMdxComponentNames(mdxRaw: string): string[] {
  const mdx = String(mdxRaw || "");
  const names = new Set<string>();
  const tagRe = /<\/?([A-Z][A-Za-z0-9_]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(mdx))) names.add(m[1]);
  return Array.from(names);
}

export function seedMissingMdxComponents(base: unknown, mdxRaw: string, options: SafeMdxOptions = {}): MDXComponentMap {
  const warnOnFallback = options.warnOnFallback ?? true;
  const baseMap: MDXComponentMap = base && typeof base === "object" ? (base as MDXComponentMap) : {};
  const seeded = { ...baseMap, ...(options.seeded || {}) } as MDXComponentMap;
  const names = detectMdxComponentNames(mdxRaw);

  for (const name of names) {
    if (!seeded[name]) {
      seeded[name] = createMissingComponent(name, warnOnFallback);
    }
  }
  return seeded;
}

export function createSeededSafeMdxComponents(base: unknown, mdxRaw: string, options: SafeMdxOptions = {}): MDXComponentMap {
  const seeded = seedMissingMdxComponents(base, mdxRaw, options);
  return createProxySafeMdxComponents(seeded, options);
}