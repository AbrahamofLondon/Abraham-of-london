// lib/mdx/safe-components.ts — BUILD-PROOF MDX COMPONENT RESOLVER (TS, NO JSX)
// Guarantees MDXRemote never receives undefined for any component key.

import * as React from "react";

export type MDXComponentMap = Record<string, React.ComponentType<any>>;

export type SafeMdxOptions = {
  warnOnFallback?: boolean;
  // Optional seed overrides (e.g. BrandFrame, Rule, Note) if you want nicer fallbacks
  seeded?: MDXComponentMap;
};

function isComponent(x: any): x is React.ComponentType<any> {
  return typeof x === "function";
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
      // eslint-disable-next-line no-console
      console.warn(`[MDX Safe] Missing component "${name}" — rendered fallback.`);
    }

    // DEV: visible red box
    if (isDev) {
      return React.createElement(
        "div",
        {
          "data-missing-component": name,
          className: cx(
            "my-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-100",
            className
          ),
          ...rest,
        },
        React.createElement(
          "div",
          { className: "text-xs font-bold uppercase tracking-widest text-red-200" },
          "Missing MDX Component"
        ),
        React.createElement("div", { className: "mt-1 font-mono text-sm text-red-100" }, name),
        children
          ? React.createElement(
              "div",
              {
                className:
                  "mt-3 rounded-lg border border-red-500/20 bg-black/20 p-3 text-sm text-red-50",
              },
              children
            )
          : React.createElement("div", { className: "mt-3 text-sm opacity-80" }, `[${name}]`)
      );
    }

    // PROD: do not break UX — render children if any, else nothing
    return children ? React.createElement(React.Fragment, null, children) : null;
  };

  Missing.displayName = `Missing(${name})`;
  return Missing;
}

// Some "nice" seeded fallbacks so key components look decent in prod
function seededDefaults(): MDXComponentMap {
  const BrandFrame: React.ComponentType<any> = (props: any) =>
    React.createElement(
      "section",
      {
        className: cx("my-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6", props?.className),
        ...props,
      },
      props?.children
    );

  const Rule: React.ComponentType<any> = (props: any) =>
    React.createElement("hr", {
      className: cx("my-10 border-0 h-px bg-white/10", props?.className),
      ...props,
    });

  const Note: React.ComponentType<any> = (props: any) =>
    React.createElement(
      "div",
      {
        className: cx(
          "my-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-100",
          props?.className
        ),
        ...props,
      },
      props?.children
    );

  BrandFrame.displayName = "BrandFrameFallback";
  Rule.displayName = "RuleFallback";
  Note.displayName = "NoteFallback";

  return { BrandFrame, Rule, Note };
}

/**
 * The only reliable fix:
 * Proxy ensures `components[AnyName]` is never undefined.
 */
export function createProxySafeMdxComponents(base: unknown, options: SafeMdxOptions = {}): MDXComponentMap {
  const warnOnFallback = options.warnOnFallback ?? true;

  const baseMap: MDXComponentMap =
    base && typeof base === "object" ? (base as MDXComponentMap) : {};

  const seeded = {
    ...seededDefaults(),
    ...(options.seeded || {}),
    ...baseMap,
  };

  const cache = new Map<string, React.ComponentType<any>>();

  return new Proxy(seeded, {
    get(target, prop: string | symbol) {
      const key = String(prop);

      // Avoid Promise-like traps and keep internals safe
      if (key === "then") return undefined;
      if (key === "__esModule") return (target as any)[key];

      const existing = (target as any)[key];
      if (isComponent(existing)) return existing;

      // If already cached missing fallback, reuse it
      const cached = cache.get(key);
      if (cached) return cached;

      const missing = createMissingComponent(key, warnOnFallback);
      cache.set(key, missing);
      return missing;
    },
  }) as unknown as MDXComponentMap;
}

// --- MDX name detection + seeding (prevents Object.assign drop) ---

/**
 * Detects all custom component names used in MDX content
 * Looks for: <ComponentName>, </ComponentName>, <ComponentName/>
 */
export function detectMdxComponentNames(mdxRaw: string): string[] {
  const mdx = String(mdxRaw || "");
  const names = new Set<string>();

  // <Component ...> and </Component>
  const tagRe = /<\/?([A-Z][A-Za-z0-9_]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(mdx))) names.add(m[1]);

  // <Component/> (covered above, but safe)
  const selfRe = /<([A-Z][A-Za-z0-9_]*)\s*\/>/g;
  while ((m = selfRe.exec(mdx))) names.add(m[1]);

  return Array.from(names);
}

/**
 * Seeds missing components as enumerable properties
 * This prevents Object.assign() from dropping them
 */
export function seedMissingMdxComponents(
  base: unknown,
  mdxRaw: string,
  options: SafeMdxOptions = {}
): MDXComponentMap {
  const warnOnFallback = options.warnOnFallback ?? true;

  const baseMap: MDXComponentMap =
    base && typeof base === "object" ? (base as MDXComponentMap) : {};

  const seeded = {
    ...baseMap,
    ...(options.seeded || {}),
  } as MDXComponentMap;

  const names = detectMdxComponentNames(mdxRaw);

  // Guarantee every detected component key exists as an enumerable property
  for (const name of names) {
    if (!seeded[name]) {
      // Use the same fallback generator your proxy uses
      seeded[name] = createMissingComponent(name, warnOnFallback);
    }
  }

  return seeded;
}

/**
 * One-stop: SEED (enumerable) + PROXY (read-safe).
 * This is the Promised Land function.
 * 
 * Usage:
 * const safeComponents = createSeededSafeMdxComponents(mdxComponents, rawMdxContent);
 * <MDXRemote {...source} components={safeComponents} />
 */
export function createSeededSafeMdxComponents(
  base: unknown,
  mdxRaw: string,
  options: SafeMdxOptions = {}
): MDXComponentMap {
  const seeded = seedMissingMdxComponents(base, mdxRaw, options);
  return createProxySafeMdxComponents(seeded, options);
}