/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { buildDiagnostic } from "./detect";
import { MDXErrorBoundary, EmptyState, SuspiciousCodeState } from "./fallbacks";
import { RawMarkdownFallback } from "./markdown";
import { transformRawMdxToMarkdownLike } from "./transform";
import type { SafeMDXRendererProps } from "./types";
import { IS_DEV, safeString } from "./utils";

function CompiledMDXRenderer({
  code,
  components,
  compileMdx,
}: {
  code: string;
  components: Record<string, any>;
  compileMdx: SafeMDXRendererProps["compileMdx"];
}) {
  const MDXContent = React.useMemo(() => compileMdx(code), [compileMdx, code]);
  return <MDXContent components={components} />;
}

export default function SafeMDXRenderer({
  code,
  components = {},
  directive,
  debug = false,
  disableBaseComponents = false,
  compileMdx,
  getBaseComponents,
  onDiagnostic,
  className,
  emptyFallback,
  suspiciousFallback,
  errorFallback,
  markdownClassName,
}: SafeMDXRendererProps) {
  const safeCode = React.useMemo(() => safeString(code).trim(), [code]);
  const [renderError, setRenderError] = React.useState<string | null>(null);

  const diagnostic = React.useMemo(() => buildDiagnostic(safeCode), [safeCode]);

  React.useEffect(() => {
    onDiagnostic?.(diagnostic);
    if (debug && IS_DEV) {
      console.log("[SafeMDXRenderer]", diagnostic);
    }
  }, [debug, diagnostic, onDiagnostic]);

  const finalComponents = React.useMemo(() => {
    const base = disableBaseComponents
      ? { ...components }
      : getBaseComponents
        ? getBaseComponents(components)
        : { ...components };

    if (directive && base.DocumentFooter) {
      const Original = base.DocumentFooter;
      const Wrapped = (props: any) => <Original {...props} directive={directive} />;
      Wrapped.displayName = "DocumentFooterWithDirective";
      base.DocumentFooter = Wrapped;
    }

    return base;
  }, [components, disableBaseComponents, directive, getBaseComponents]);

  if (!safeCode) {
    return <>{emptyFallback ?? <EmptyState />}</>;
  }

  if (diagnostic.kind === "suspicious-module") {
    return (
      <>
        {typeof suspiciousFallback === "function"
          ? suspiciousFallback(safeCode)
          : suspiciousFallback ?? <SuspiciousCodeState code={safeCode} />}
      </>
    );
  }

  if (diagnostic.kind === "raw-mdx") {
    const normalized = transformRawMdxToMarkdownLike(safeCode);
    return <RawMarkdownFallback content={normalized} className={markdownClassName} />;
  }

  if (diagnostic.kind === "raw-markdown" || diagnostic.kind === "plain-text") {
    return <RawMarkdownFallback content={safeCode} className={markdownClassName} />;
  }

  return (
    <MDXErrorBoundary
      onError={(message) => setRenderError(message)}
      fallback={
        typeof errorFallback === "function"
          ? errorFallback(renderError, safeCode)
          : errorFallback ?? (
              <div className="smdx-error">
                <div className="smdx-kicker">MDX Rendering Failed</div>
                <p className="smdx-copy">The content could not be rendered properly.</p>
                {IS_DEV ? <pre className="smdx-pre">{safeCode.slice(0, 4000)}</pre> : null}
              </div>
            )
      }
    >
      <div className={className ?? "smdx-prose"}>
        <CompiledMDXRenderer
          code={safeCode}
          components={finalComponents}
          compileMdx={compileMdx}
        />
      </div>
    </MDXErrorBoundary>
  );
}
