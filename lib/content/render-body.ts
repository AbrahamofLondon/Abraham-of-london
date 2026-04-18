/* lib/content/render-body.ts — UNIFIED RENDER CONTRACT (SSOT)
 *
 * Every MDX-rendering route MUST consume this.
 * No direct access to doc.body.code, doc.body.raw, or doc.bodyCode.
 * All classification decisions happen here.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RenderBodyMode =
  | "compiled"
  | "raw-mdx"
  | "markdown"
  | "suspicious"
  | "empty";

export type RenderDiagnostics = {
  /** Components referenced in raw content that may not be in the registry */
  referencedComponents: string[];
  /** True if the resolved code is a fallback rather than the primary body.code */
  usedFallback: boolean;
  /** True if leaked module code was detected in any candidate */
  suspicious: boolean;
  /** Which source field provided the final code */
  source: string;
};

export type RenderBodyResult = {
  mode: RenderBodyMode;
  /** The code to pass to SafeMDXRenderer. Empty string if mode is "empty". */
  code: string;
  diagnostics: RenderDiagnostics;
};

// ---------------------------------------------------------------------------
// Detection helpers
// ---------------------------------------------------------------------------

function asString(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : value == null
      ? ""
      : String(value).trim();
}

function looksLikeCompiledMdx(value: string): boolean {
  if (!value) return false;

  return (
    /\bfunction\s+MDXContent\s*\(/.test(value) ||
    /\buseMDXComponents\b/.test(value) ||
    /\breturn\s+_jsx\s*\(/.test(value) ||
    /\breturn\s+_jsxs\s*\(/.test(value) ||
    /\b_jsx\s*\(/.test(value) ||
    /\b_jsxs\s*\(/.test(value) ||
    /\bjsxDEV\s*\(/.test(value) ||
    /react\/jsx-runtime/.test(value) ||
    /\/\*@jsxRuntime\s+automatic\*\//.test(value)
  );
}

function looksLikeLeakedModuleCode(value: string): boolean {
  if (!value) return false;

  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(value) ||
    /\bmodule\.exports\b/.test(value) ||
    /\bexports\.[A-Za-z_$]/.test(value) ||
    /\b__esModule\b/.test(value) ||
    /\brequire\s*\(/.test(value)
  );
}

function looksLikeRawMdx(value: string): boolean {
  if (!value) return false;
  if (looksLikeCompiledMdx(value) || looksLikeLeakedModuleCode(value)) {
    return false;
  }

  return (
    /^\s*import\s.+from\s+["'][^"']+["'];?\s*$/m.test(value) ||
    /^\s*export\s.+$/m.test(value) ||
    /<[A-Z][A-Za-z0-9._-]*\b[^>]*>/.test(value) ||
    /<\/[A-Z][A-Za-z0-9._-]*>/.test(value)
  );
}

function looksLikeReadableText(value: string): boolean {
  if (!value) return false;
  if (looksLikeCompiledMdx(value)) return false;
  if (looksLikeLeakedModuleCode(value)) return false;

  return (
    /^#{1,6}\s+/m.test(value) ||
    /^\s*[-*+]\s+/m.test(value) ||
    /^\s*\d+\.\s+/m.test(value) ||
    /(^|\n)\s*>\s+/.test(value) ||
    /\[([^\]]+)\]\(([^)]+)\)/.test(value) ||
    /```[\s\S]*?```/.test(value) ||
    /\*\*[^*]+\*\*/.test(value) ||
    /^\|(.+)\|$/m.test(value) ||
    value.length > 80
  );
}

/** Extract component names referenced as JSX tags in raw content */
function extractReferencedComponents(value: string): string[] {
  if (!value) return [];
  const matches = value.match(/<([A-Z][A-Za-z0-9._-]*)\b/g);
  if (!matches) return [];
  const names = new Set(matches.map((m) => m.slice(1)));
  return Array.from(names);
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

export function getRenderableBody(doc: any): RenderBodyResult {
  const diagnostics: RenderDiagnostics = {
    referencedComponents: [],
    usedFallback: false,
    suspicious: false,
    source: "none",
  };

  const bodyCode = asString(doc?.body?.code);
  const legacyBodyCode = asString(doc?.bodyCode);

  // 1. Primary: compiled body.code
  if (bodyCode && looksLikeCompiledMdx(bodyCode) && !looksLikeLeakedModuleCode(bodyCode)) {
    diagnostics.source = "body.code";
    return { mode: "compiled", code: bodyCode, diagnostics };
  }

  // 2. Legacy: compiled bodyCode field
  if (
    legacyBodyCode &&
    looksLikeCompiledMdx(legacyBodyCode) &&
    !looksLikeLeakedModuleCode(legacyBodyCode)
  ) {
    diagnostics.source = "bodyCode";
    diagnostics.usedFallback = true;
    return { mode: "compiled", code: legacyBodyCode, diagnostics };
  }

  // 3. Raw content candidates (body.raw, content, mdx, string body)
  const rawBody = asString(doc?.body?.raw);
  const content = asString(doc?.content);
  const mdx = asString(doc?.mdx);
  const stringBody = typeof doc?.body === "string" ? asString(doc.body) : "";

  const rawCandidate = rawBody || content || mdx || stringBody;
  const rawSource = rawBody
    ? "body.raw"
    : content
      ? "content"
      : mdx
        ? "mdx"
        : stringBody
          ? "body(string)"
          : "none";

  if (rawCandidate && looksLikeReadableText(rawCandidate)) {
    diagnostics.source = rawSource;
    diagnostics.usedFallback = true;
    diagnostics.referencedComponents = extractReferencedComponents(rawCandidate);

    if (looksLikeRawMdx(rawCandidate)) {
      return { mode: "raw-mdx", code: rawCandidate, diagnostics };
    }

    return { mode: "markdown", code: rawCandidate, diagnostics };
  }

  // 4. Suspicious: body.code exists but doesn't look compiled
  if (bodyCode && looksLikeLeakedModuleCode(bodyCode)) {
    diagnostics.source = "body.code(suspicious)";
    diagnostics.suspicious = true;
    return { mode: "suspicious", code: bodyCode, diagnostics };
  }

  if (legacyBodyCode && looksLikeLeakedModuleCode(legacyBodyCode)) {
    diagnostics.source = "bodyCode(suspicious)";
    diagnostics.suspicious = true;
    return { mode: "suspicious", code: legacyBodyCode, diagnostics };
  }

  // 5. Last resort: non-compiled body.code (may still be usable by useMDXComponent)
  if (bodyCode) {
    diagnostics.source = "body.code(unclassified)";
    diagnostics.usedFallback = true;
    return { mode: "compiled", code: bodyCode, diagnostics };
  }

  if (legacyBodyCode) {
    diagnostics.source = "bodyCode(unclassified)";
    diagnostics.usedFallback = true;
    return { mode: "compiled", code: legacyBodyCode, diagnostics };
  }

  // 6. Empty
  diagnostics.source = "none";
  return { mode: "empty", code: "", diagnostics };
}
