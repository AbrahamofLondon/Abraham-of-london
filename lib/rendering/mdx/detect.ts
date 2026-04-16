import type { ContentKind, RenderDiagnostic } from "./types";
import { preview } from "./utils";

export function looksLikeCompiledMdx(code: string): boolean {
  const s = code.trim();
  if (!s) return false;

  return (
    /\bfunction\s+MDXContent\s*\(/.test(s) ||
    /\buseMDXComponents\b/.test(s) ||
    /\breturn\s+_jsx\s*\(/.test(s) ||
    /\breturn\s+_jsxs\s*\(/.test(s) ||
    /\b_jsx\s*\(/.test(s) ||
    /\b_jsxs\s*\(/.test(s) ||
    /\bjsxDEV\s*\(/.test(s) ||
    /react\/jsx-runtime/.test(s) ||
    /\/\*@jsxRuntime\s+automatic\*\//.test(s) ||
    /_createMdxContent\s*\(/.test(s) ||
    /MDXLayout\s*=/.test(s)
  );
}

export function looksLikeLeakedModuleCode(code: string): boolean {
  const s = code.trim();
  if (!s) return false;

  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(s) ||
    /\bmodule\.exports\b/.test(s) ||
    /\bexports\.[A-Za-z_$]/.test(s) ||
    /\b__esModule\b/.test(s) ||
    /\brequire\s*\(/.test(s) ||
    /webpackJsonp|__webpack_require__|__vite_ssr_import_/.test(s)
  );
}

export function looksLikeRawMdx(code: string): boolean {
  const s = code.trim();
  if (!s) return false;
  if (looksLikeCompiledMdx(s) || looksLikeLeakedModuleCode(s)) return false;

  return (
    /^\s*import\s.+from\s+["'][^"']+["'];?\s*$/m.test(s) ||
    /^\s*export\s.+$/m.test(s) ||
    /<[A-Z][A-Za-z0-9._-]*\b[^>]*>/.test(s) ||
    /<\/[A-Z][A-Za-z0-9._-]*>/.test(s) ||
    /<[A-Z][A-Za-z0-9._-]*\b[^>]*/.test(s) ||
    /\{[^\n]*<[A-Z]/.test(s)
  );
}

export function looksLikeRawMarkdown(code: string): boolean {
  const s = code.trim();
  if (!s) return false;
  if (looksLikeCompiledMdx(s) || looksLikeLeakedModuleCode(s)) return false;

  return (
    /^#{1,6}\s+/m.test(s) ||
    /^\s*[-*+]\s+/m.test(s) ||
    /^\s*\d+\.\s+/m.test(s) ||
    /(^|\n)\s*>\s+/.test(s) ||
    /\[([^\]]+)\]\(([^)]+)\)/.test(s) ||
    /```[\s\S]*?```/.test(s) ||
    /\*\*[^*]+\*\*/.test(s) ||
    /^---$/m.test(s) ||
    /^\|(.+)\|$/m.test(s)
  );
}

export function classifyContent(code: string): ContentKind {
  const s = code.trim();
  if (!s) return "empty";
  if (looksLikeLeakedModuleCode(s)) return "suspicious-module";
  if (looksLikeCompiledMdx(s)) return "compiled-mdx";
  if (looksLikeRawMdx(s)) return "raw-mdx";
  if (looksLikeRawMarkdown(s)) return "raw-markdown";
  return "plain-text";
}

export function buildDiagnostic(code: string): RenderDiagnostic {
  const kind = classifyContent(code);

  return {
    kind,
    codeLength: code.length,
    preview: preview(code),
    flags: {
      compiled: kind === "compiled-mdx",
      suspicious: kind === "suspicious-module",
      rawMdx: kind === "raw-mdx",
      rawMarkdown: kind === "raw-markdown",
    },
  };
}
