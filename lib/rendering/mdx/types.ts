import * as React from "react";

export type TierDirective = {
  requiredTier?: string;
  message?: string;
} | null;

export type ContentKind =
  | "empty"
  | "suspicious-module"
  | "compiled-mdx"
  | "raw-mdx"
  | "raw-markdown"
  | "plain-text";

export type RenderDiagnostic = {
  kind: ContentKind;
  codeLength: number;
  preview: string;
  flags: {
    compiled: boolean;
    suspicious: boolean;
    rawMdx: boolean;
    rawMarkdown: boolean;
  };
  message?: string;
};

export type SafeMdxComponents = Record<string, React.ComponentType<any> | keyof JSX.IntrinsicElements | any>;

export type CompileMdxFn = (code: string) => React.ComponentType<{ components?: SafeMdxComponents }>;

export type GetBaseComponentsFn = (components?: SafeMdxComponents) => SafeMdxComponents;

export type SafeMDXRendererProps = {
  code?: string | null;
  components?: SafeMdxComponents;
  directive?: TierDirective;
  debug?: boolean;
  disableBaseComponents?: boolean;
  compileMdx: CompileMdxFn;
  getBaseComponents?: GetBaseComponentsFn;
  onDiagnostic?: (diagnostic: RenderDiagnostic) => void;
  className?: string;
  emptyFallback?: React.ReactNode;
  suspiciousFallback?: React.ReactNode | ((code: string) => React.ReactNode);
  errorFallback?: React.ReactNode | ((message: string | null, code: string) => React.ReactNode);
  markdownClassName?: string;
};
